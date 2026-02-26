<?php

namespace App\Http\Controllers\Api;

use App\Enums\TipoMensajeWhatsApp;
use App\Http\Controllers\Controller;
use App\Models\WhatsAppContacto;
use App\Models\WhatsAppMensaje;
use App\Services\WhatsApp\EvolutionApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class WhatsAppWebhookController extends Controller
{
    public function __construct(
        private EvolutionApiService $evolutionApi
    ) {}

    /**
     * Manejar webhook de Evolution API.
     *
     * Acepta evento desde: URL path (webhookByEvents=true) O body JSON (webhookByEvents=false).
     * Evolution API con webhookByEvents=true envía a: /webhook/messages-upsert
     * Evolution API con webhookByEvents=false envía: {"event": "messages.upsert", ...}
     */
    public function handle(Request $request, ?string $event = null): JsonResponse
    {
        // Prioridad: evento en URL path > evento en body JSON
        $eventName = $this->resolverEvento($event, $request->input('event'));
        $data = $request->all();

        Log::channel('whatsapp')->info('Webhook recibido', [
            'event' => $eventName,
            'url_path_event' => $event,
            'body_event' => $request->input('event'),
        ]);

        return match ($eventName) {
            'messages.upsert', 'messages-upsert', 'MESSAGES_UPSERT' => $this->handleMessageUpsert($data),
            'connection.update', 'connection-update', 'CONNECTION_UPDATE' => $this->handleConnectionUpdate($data),
            'qrcode.updated', 'qrcode-updated', 'QRCODE_UPDATED' => $this->handleQrCodeUpdated($data),
            default => response()->json(['status' => 'ignored', 'event' => $eventName]),
        };
    }

    /**
     * Resolver el nombre del evento desde URL path o body.
     */
    private function resolverEvento(?string $urlEvent, ?string $bodyEvent): string
    {
        if ($urlEvent) {
            return $urlEvent;
        }

        return $bodyEvent ?? 'unknown';
    }

    /**
     * Manejar nuevo mensaje recibido.
     */
    private function handleMessageUpsert(array $data): JsonResponse
    {
        $message = $data['data'] ?? [];

        if (empty($message)) {
            return response()->json(['status' => 'no_data']);
        }

        $key = $message['key'] ?? [];
        $messageContent = $message['message'] ?? [];

        $isFromMe = $key['fromMe'] ?? false;
        $remoteJid = $key['remoteJid'] ?? '';
        $messageId = $key['id'] ?? null;

        // Saltar grupos
        if (str_contains($remoteJid, '@g.us') || empty($remoteJid)) {
            return response()->json(['status' => 'ignored_group']);
        }

        // Verificar si el mensaje ya existe
        if ($messageId && WhatsAppMensaje::where('whatsapp_id', $messageId)->exists()) {
            return response()->json(['status' => 'message_exists']);
        }

        // Usar método centralizado para buscar/crear contacto
        $nombre = $message['pushName'] ?? null;
        $contacto = WhatsAppContacto::buscarOCrear($remoteJid, [
            'nombre' => $nombre ?? WhatsAppContacto::extraerTelefono($remoteJid) ?? $remoteJid,
            'en_linea' => true,
        ]);

        if (! $contacto) {
            return response()->json(['status' => 'invalid_contact']);
        }

        // Si el remoteJid es @lid y el contacto no tenía lid_id, guardarlo
        if (str_ends_with($remoteJid, '@lid') && $contacto->lid_id !== $remoteJid) {
            $contacto->update(['lid_id' => $remoteJid]);
        }

        // Actualizar nombre si cambió
        $telefono = WhatsAppContacto::extraerTelefono($remoteJid);
        if (! empty($nombre) && ($contacto->nombre === $telefono || $contacto->nombre === $contacto->whatsapp_id)) {
            $contacto->update(['nombre' => $nombre]);
        }

        $mediaTipo = $this->determinarTipoMensaje($messageContent);
        $contenido = $this->extraerContenido($messageContent, $mediaTipo);
        $mediaUrl = null;

        // Descargar media si existe
        if ($messageId && in_array($mediaTipo, ['imagen', 'video', 'audio', 'documento', 'sticker'])) {
            $mediaUrl = $this->descargarYGuardarMedia($messageId, $mediaTipo, $messageContent);
        }

        WhatsAppMensaje::create([
            'contacto_id' => $contacto->id,
            'whatsapp_id' => $messageId,
            'tipo' => $isFromMe ? TipoMensajeWhatsApp::Enviado : TipoMensajeWhatsApp::Recibido,
            'contenido' => $contenido,
            'media_url' => $mediaUrl,
            'media_tipo' => $mediaTipo !== 'texto' ? $mediaTipo : null,
            'enviado_at' => now(),
            'leido' => $isFromMe,
            'es_bot' => false,
        ]);

        Log::channel('whatsapp')->info('Mensaje guardado via webhook', [
            'contacto_id' => $contacto->id,
            'contacto_nombre' => $contacto->nombre,
            'remoteJid' => $remoteJid,
            'es_lid' => str_ends_with($remoteJid, '@lid'),
            'tipo' => $isFromMe ? 'enviado' : 'recibido',
        ]);

        return response()->json(['status' => 'message_saved']);
    }

    /**
     * Extraer base64 incluido en el payload del webhook (base64: true en config).
     */
    private function extraerBase64DelPayload(array $messageContent, string $mediaTipo): ?string
    {
        $key = match ($mediaTipo) {
            'imagen'    => 'imageMessage',
            'video'     => 'videoMessage',
            'audio'     => 'audioMessage',
            'documento' => 'documentMessage',
            'sticker'   => 'stickerMessage',
            default     => null,
        };

        if (! $key || empty($messageContent[$key]['base64'])) {
            return null;
        }

        $raw = $messageContent[$key]['base64'];

        // Quitar prefijo "data:...;base64," si existe
        if (str_contains($raw, ';base64,')) {
            $raw = substr($raw, strpos($raw, ';base64,') + 8);
        }

        return $raw;
    }

    /**
     * Extraer mimetype del payload del webhook.
     */
    private function extraerMimeTypeDelPayload(array $messageContent, string $mediaTipo): ?string
    {
        $key = match ($mediaTipo) {
            'imagen'    => 'imageMessage',
            'video'     => 'videoMessage',
            'audio'     => 'audioMessage',
            'documento' => 'documentMessage',
            'sticker'   => 'stickerMessage',
            default     => null,
        };

        if (! $key) {
            return null;
        }

        // Normalizar "audio/ogg; codecs=opus" → "audio/ogg"
        $mime = $messageContent[$key]['mimetype'] ?? null;
        if ($mime && str_contains($mime, ';')) {
            $mime = trim(explode(';', $mime)[0]);
        }

        return $mime ?: null;
    }

    /**
     * Descargar y guardar media en storage.
     * Primero intenta usar el base64 incluido en el payload (base64: true),
     * y hace fallback a la API solo si no está disponible.
     */
    private function descargarYGuardarMedia(string $messageId, string $mediaTipo, array $messageContent): ?string
    {
        try {
            // 1. Intentar base64 del payload del webhook
            $base64 = $this->extraerBase64DelPayload($messageContent, $mediaTipo);
            $mimeType = $this->extraerMimeTypeDelPayload($messageContent, $mediaTipo) ?? $this->getMimeTypeForMedia($mediaTipo);

            // 2. Fallback: descargar via API
            if (! $base64) {
                $mediaData = $this->evolutionApi->descargarMedia($messageId, $mediaTipo);

                if (! $mediaData || empty($mediaData['base64'])) {
                    Log::channel('whatsapp')->warning('No se pudo obtener media', ['messageId' => $messageId]);

                    return null;
                }

                $raw = $mediaData['base64'];
                if (str_contains($raw, ';base64,')) {
                    $raw = substr($raw, strpos($raw, ';base64,') + 8);
                }
                $base64 = $raw;
                $mimeType = $mediaData['mimetype'] ?? $mimeType;
                if (str_contains($mimeType, ';')) {
                    $mimeType = trim(explode(';', $mimeType)[0]);
                }
            }

            $extension = $this->getExtensionFromMimeType($mimeType, $mediaTipo, $messageContent);
            $fileName = 'whatsapp/'.date('Y/m/').Str::uuid().'.'.$extension;

            Storage::disk('public')->put($fileName, base64_decode($base64));

            return asset('storage/'.$fileName);
        } catch (\Exception $e) {
            Log::channel('whatsapp')->error('Error al guardar media', [
                'messageId' => $messageId,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Obtener mime type por defecto para un tipo de media.
     */
    private function getMimeTypeForMedia(string $mediaTipo): string
    {
        return match ($mediaTipo) {
            'imagen' => 'image/jpeg',
            'video' => 'video/mp4',
            'audio' => 'audio/ogg',
            'sticker' => 'image/webp',
            'documento' => 'application/octet-stream',
            default => 'application/octet-stream',
        };
    }

    /**
     * Obtener extensión desde el mime type o contenido del mensaje.
     */
    private function getExtensionFromMimeType(string $mimeType, string $mediaTipo, array $messageContent): string
    {
        // Para documentos, intentar obtener la extensión del nombre del archivo
        if ($mediaTipo === 'documento' && isset($messageContent['documentMessage']['fileName'])) {
            $fileName = $messageContent['documentMessage']['fileName'];
            $ext = pathinfo($fileName, PATHINFO_EXTENSION);
            if ($ext) {
                return $ext;
            }
        }

        $mimeMap = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            'video/mp4' => 'mp4',
            'video/3gpp' => '3gp',
            'audio/ogg' => 'ogg',
            'audio/mpeg' => 'mp3',
            'audio/mp4' => 'm4a',
            'application/pdf' => 'pdf',
            'application/msword' => 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
            'application/vnd.ms-excel' => 'xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'xlsx',
        ];

        return $mimeMap[$mimeType] ?? match ($mediaTipo) {
            'imagen' => 'jpg',
            'video' => 'mp4',
            'audio' => 'ogg',
            'sticker' => 'webp',
            default => 'bin',
        };
    }

    /**
     * Manejar actualización de conexión.
     */
    private function handleConnectionUpdate(array $data): JsonResponse
    {
        $state = $data['data']['state'] ?? 'unknown';

        Log::channel('whatsapp')->info('Estado de conexión actualizado', [
            'state' => $state,
        ]);

        cache()->put('whatsapp_connection_state', $state, now()->addHours(1));

        // Actualizar el cache de estado para que el frontend lo detecte de inmediato
        if ($state === 'open') {
            cache()->put('whatsapp_estado_conexion', 'conectado', 30);
            cache()->forget('whatsapp_qrcode');
        } elseif (in_array($state, ['close', 'offline', 'disconnected'])) {
            cache()->forget('whatsapp_estado_conexion');
            cache()->forget('whatsapp_qrcode');
        }

        return response()->json(['status' => 'connection_updated', 'state' => $state]);
    }

    /**
     * Manejar actualización de QR code.
     */
    private function handleQrCodeUpdated(array $data): JsonResponse
    {
        $qrcodeData = $data['data']['qrcode'] ?? null;

        if ($qrcodeData) {
            // Extraer el base64 ya sea string directo u objeto con campo base64
            $rawBase64 = is_string($qrcodeData) ? $qrcodeData : ($qrcodeData['base64'] ?? null);

            if ($rawBase64) {
                $base64 = str_starts_with($rawBase64, 'data:') ? $rawBase64 : 'data:image/png;base64,'.$rawBase64;
                cache()->put('whatsapp_qrcode', $base64, now()->addMinutes(3));
                \Illuminate\Support\Facades\Cache::forget('whatsapp_estado_conexion');
            }
        }

        return response()->json(['status' => 'qrcode_updated']);
    }

    /**
     * Determinar el tipo de mensaje basado en el contenido.
     */
    private function determinarTipoMensaje(array $messageContent): string
    {
        if (isset($messageContent['imageMessage'])) {
            return 'imagen';
        }

        if (isset($messageContent['videoMessage'])) {
            return 'video';
        }

        if (isset($messageContent['audioMessage'])) {
            return 'audio';
        }

        if (isset($messageContent['documentMessage'])) {
            return 'documento';
        }

        if (isset($messageContent['stickerMessage'])) {
            return 'sticker';
        }

        return 'texto';
    }

    /**
     * Extraer el contenido del mensaje.
     */
    private function extraerContenido(array $messageContent, string $tipo): string
    {
        return match ($tipo) {
            'texto' => $messageContent['conversation']
                ?? $messageContent['extendedTextMessage']['text']
                ?? '',
            'imagen' => $messageContent['imageMessage']['caption'] ?? '[Imagen]',
            'video' => $messageContent['videoMessage']['caption'] ?? '[Video]',
            'audio' => '[Audio]',
            'documento' => '[Documento: '.($messageContent['documentMessage']['fileName'] ?? 'archivo').']',
            'sticker' => '[Sticker]',
            default => '',
        };
    }
}
