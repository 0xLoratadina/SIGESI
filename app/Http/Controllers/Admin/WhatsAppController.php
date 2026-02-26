<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\WhatsAppContacto;
use App\Models\WhatsAppMensaje;
use App\Services\WhatsApp\EvolutionApiService;
use App\Services\WhatsApp\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class WhatsAppController extends Controller
{
    public function __construct(
        private WhatsAppService $whatsAppService,
        private EvolutionApiService $evolutionApi
    ) {
    }

    public function index(): Response
    {
        $estadoConexion = $this->obtenerEstadoConexion();
        $conectado = $estadoConexion === 'conectado';

        return Inertia::render('admin/whatsapp/index', [
            'chats' => $conectado ? $this->whatsAppService->getChats() : [],
            'mensajes' => $conectado
                ? Inertia::defer(fn() => $this->whatsAppService->getMensajesPorChat())
                : [],
            'tickets' => $conectado ? $this->whatsAppService->getTicketsPorChat() : [],
            'estadoConexion' => $estadoConexion,
            'ultimaActualizacion' => now()->toISOString(),
        ]);
    }

    /**
     * Obtener actualizaciones (mensajes nuevos) desde un timestamp.
     * Polling híbrido: primero BD, si no hay nada nuevo, fallback a API.
     */
    public function actualizaciones(Request $request): JsonResponse
    {
        $desde = $request->input('desde');
        $timestamp = $desde ? \Carbon\Carbon::parse($desde) : now()->subMinutes(5);

        $mensajesNuevos = WhatsAppMensaje::with('contacto')
            ->where('created_at', '>', $timestamp)
            ->orderBy('created_at')
            ->get();

        $mensajesPorChat = $this->agruparMensajesPorChat($mensajesNuevos);

        $contactoIds = $mensajesNuevos->pluck('contacto_id')->unique();
        $chatsActualizados = $this->obtenerChatsActualizados($contactoIds, $timestamp);

        return response()->json([
            'mensajes' => $mensajesPorChat,
            'chats' => $chatsActualizados,
            'timestamp' => now()->toISOString(),
            'hayNuevos' => $mensajesNuevos->isNotEmpty(),
        ]);
    }

    /**
     * @param \Illuminate\Support\Collection<int, WhatsAppMensaje> $mensajes
     * @return array<string, list<array<string, mixed>>>
     */
    private function agruparMensajesPorChat(\Illuminate\Support\Collection $mensajes): array
    {
        $agrupados = [];
        foreach ($mensajes as $mensaje) {
            /** @var WhatsAppMensaje $mensaje */
            $contactoId = (string) $mensaje->contacto_id;
            $agrupados[$contactoId][] = [
                'id' => (string) $mensaje->id,
                'whatsapp_id' => $mensaje->whatsapp_id,
                'tipo' => $mensaje->tipo->value,
                'contenido' => $mensaje->contenido,
                'hora' => $mensaje->enviado_at->format('H:i'),
                'leido' => $mensaje->leido,
                'es_bot' => $mensaje->es_bot,
                'media_url' => $mensaje->media_url,
                'media_tipo' => $mensaje->media_tipo,
                'respuesta_a' => $mensaje->respuesta_a_id ? [
                    'contenido' => $mensaje->respuesta_a_contenido,
                    'tipo' => $mensaje->respuesta_a_tipo,
                ] : null,
            ];
        }
        return $agrupados;
    }

    /**
     * @param \Illuminate\Support\Collection<int, mixed> $contactoIds
     * @return array<string, array<string, mixed>>
     */
    private function obtenerChatsActualizados(\Illuminate\Support\Collection $contactoIds, \Carbon\Carbon $timestamp): array
    {
        $contactos = WhatsAppContacto::query()
            ->where(function ($q) use ($contactoIds, $timestamp) {
                $q->whereIn('id', $contactoIds)
                    ->orWhere('updated_at', '>', $timestamp);
            })
            ->with(['mensajes' => fn($q) => $q->latest('enviado_at')->limit(1)])
            ->withCount(['mensajes as no_leidos' => fn($q) => $q->where('tipo', 'recibido')->where('leido', false)])
            ->get();

        return $contactos->map(function (WhatsAppContacto $contacto) {
            $ultimoMensaje = $contacto->mensajes->first();

            return [
                'id' => (string) $contacto->id,
                'nombre' => $contacto->nombre,
                'telefono' => $contacto->telefono,
                'avatar' => $contacto->avatar,
                'ultimo_mensaje' => $ultimoMensaje?->contenido ?? '',
                'hora_ultimo' => $ultimoMensaje?->enviado_at->format('H:i') ?? '',
                'ultimo_mensaje_at' => $ultimoMensaje?->enviado_at?->toISOString(),
                'no_leidos' => $contacto->no_leidos,
                'en_linea' => $contacto->en_linea,
                'estado_ticket' => $contacto->estado_ticket->value,
            ];
        })->keyBy('id')->all();
    }

    /**
     * Sync rápido de mensajes recientes desde Evolution API.
     * Throttled: máximo 1 vez cada 10 segundos.
     */
    private function sincronizarRecientes(?string $chatActivoId = null): void
    {
        $cacheKey = 'whatsapp_sync_recientes';
        if (Cache::has($cacheKey)) {
            return;
        }
        Cache::put($cacheKey, true, 30);

        try {
            // Si hay chat activo, priorizar ese contacto
            $contactos = collect();

            if ($chatActivoId) {
                $contactoActivo = WhatsAppContacto::find($chatActivoId);
                if ($contactoActivo) {
                    $contactos->push($contactoActivo);
                }
            }

            // Agregar contactos con actividad reciente (máximo 5)
            $contactosRecientes = WhatsAppContacto::query()
                ->when($chatActivoId, fn($q) => $q->where('id', '!=', $chatActivoId))
                ->orderByDesc('updated_at')
                ->limit(5)
                ->get();
            $contactos = $contactos->merge($contactosRecientes);

            foreach ($contactos as $contacto) {
                if (!$contacto->whatsapp_id) {
                    continue;
                }

                $mensajesApi = $this->evolutionApi->obtenerMensajes($contacto->whatsapp_id, 10);
                $mensajes = $mensajesApi['messages']['records'] ?? $mensajesApi ?? [];

                if (is_array($mensajes)) {
                    $this->guardarMensajes($contacto, $mensajes);
                }
            }
        } catch (\Exception $e) {
            Log::channel('whatsapp')->warning('Error en sincronización rápida', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Obtener estado de conexión cacheado (30 segundos).
     */
    private function obtenerEstadoConexion(): string
    {
        return Cache::remember('whatsapp_estado_conexion', 30, function () {
            $estado = $this->evolutionApi->obtenerEstado();

            // Si la instancia no existe en Evolution API, limpiar caches y retornar desconectado
            if (!empty($estado['instanceNotFound'])) {
                cache()->forget('whatsapp_qrcode');
                return 'desconectado';
            }

            if (($estado['instance']['state'] ?? 'close') === 'open') {
                return 'conectado';
            }

            $qrcode = cache()->get('whatsapp_qrcode');
            if ($qrcode) {
                return 'conectando';
            }

            return 'desconectado';
        });
    }

    /**
     * Conectar WhatsApp (crear instancia y obtener QR).
     */
    public function conectar(): JsonResponse
    {
        try {
            $resultado = $this->evolutionApi->crearInstancia();

            if (isset($resultado['error'])) {
                // La instancia puede ya existir, intentar reconectar directamente
                $reconexion = $this->evolutionApi->reconectar();
                if ($reconexion && isset($reconexion['base64'])) {
                    $qrcode = $this->normalizarBase64Qr($reconexion['base64']);
                    cache()->put('whatsapp_qrcode', $qrcode, now()->addMinutes(3));
                    Cache::forget('whatsapp_estado_conexion');

                    // Reconfigurar webhook en caso de que se haya perdido (ej: reinicio de Docker)
                    $this->configurarWebhookAutomatico();

                    return response()->json([
                        'status' => 'ok',
                        'qrcode' => $qrcode,
                    ]);
                }

                return response()->json(['error' => $resultado['message']], 500);
            }

            $rawBase64 = $resultado['qrcode']['base64'] ?? null;
            $qrcode = $rawBase64 ? $this->normalizarBase64Qr($rawBase64) : null;

            if ($qrcode) {
                cache()->put('whatsapp_qrcode', $qrcode, now()->addMinutes(3));
            }

            // Configurar webhook automáticamente
            $this->configurarWebhookAutomatico();

            Cache::forget('whatsapp_estado_conexion');

            return response()->json([
                'status' => 'ok',
                'qrcode' => $qrcode,
            ]);
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::channel('whatsapp')->error('Error de conexión con Evolution API', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'No se pudo conectar con Evolution API. Verifica que el servicio esté corriendo.',
            ], 503);
        } catch (\Exception $e) {
            Log::channel('whatsapp')->error('Error inesperado al conectar WhatsApp', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Error inesperado: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Configurar webhook automáticamente.
     */
    private function configurarWebhookAutomatico(): void
    {
        // Determinar la URL del webhook según el entorno
        $appUrl = config('app.url');

        // Si estamos en desarrollo local y Evolution API está en Docker,
        // necesitamos usar host.docker.internal
        if (str_contains($appUrl, 'localhost') || str_contains($appUrl, '127.0.0.1')) {
            $webhookUrl = str_replace(['localhost', '127.0.0.1'], 'host.docker.internal', $appUrl);
        } else {
            $webhookUrl = $appUrl;
        }

        $webhookUrl .= '/api/whatsapp/webhook';

        $this->evolutionApi->configurarWebhook($webhookUrl);
    }

    /**
     * Obtener QR code actual.
     */
    public function qrcode(): JsonResponse
    {
        $qrcodeCache = cache()->get('whatsapp_qrcode');

        if ($qrcodeCache) {
            return response()->json(['qrcode' => $qrcodeCache]);
        }

        $resultado = $this->evolutionApi->obtenerQrCode();

        if (!$resultado) {
            return response()->json(['error' => 'No hay QR disponible'], 404);
        }

        $rawBase64 = $resultado['base64'] ?? null;
        $qrcode = $rawBase64 ? $this->normalizarBase64Qr($rawBase64) : null;

        return response()->json(['qrcode' => $qrcode]);
    }

    /**
     * Obtener estado actual de la conexion.
     */
    public function estado(): JsonResponse
    {
        $resultado = $this->evolutionApi->obtenerEstado();

        // Si la instancia ya no existe, limpiar caches
        if (!empty($resultado['instanceNotFound'])) {
            cache()->forget('whatsapp_qrcode');
            Cache::forget('whatsapp_estado_conexion');
        }

        return response()->json([
            'conectado' => ($resultado['instance']['state'] ?? 'close') === 'open',
            'estado' => $resultado['instance']['state'] ?? 'close',
        ]);
    }

    /**
     * Desconectar WhatsApp.
     */
    public function desconectar(): JsonResponse
    {
        $exito = $this->evolutionApi->desconectar();

        cache()->forget('whatsapp_qrcode');
        cache()->forget('whatsapp_connection_state');
        Cache::forget('whatsapp_estado_conexion');

        return response()->json(['status' => $exito ? 'ok' : 'error']);
    }

    /**
     * Enviar mensaje de texto.
     */
    public function enviarMensaje(Request $request, WhatsAppContacto $contacto): JsonResponse
    {
        $request->validate([
            'mensaje' => ['required', 'string', 'max:4096'],
            'respuesta_a_id' => ['nullable', 'string'],
            'respuesta_a_contenido' => ['nullable', 'string', 'max:500'],
            'respuesta_a_tipo' => ['nullable', 'string', 'in:recibido,enviado'],
        ]);

        $respuestaAId = $request->input('respuesta_a_id');
        $respuestaAContenido = $request->input('respuesta_a_contenido');
        $respuestaATipo = $request->input('respuesta_a_tipo');

        if ($respuestaAId && $respuestaAContenido) {
            $fromMe = $respuestaATipo === 'enviado';
            $resultado = $this->evolutionApi->enviarTextoConCita(
                $contacto->telefono,
                $request->input('mensaje'),
                $respuestaAId,
                $fromMe,
                $respuestaAContenido
            );
        } else {
            $resultado = $this->evolutionApi->enviarTexto(
                $contacto->telefono,
                $request->input('mensaje')
            );
        }

        if (isset($resultado['error'])) {
            return response()->json(['error' => $resultado['message']], 500);
        }

        WhatsAppMensaje::create([
            'contacto_id' => $contacto->id,
            'whatsapp_id' => $resultado['key']['id'] ?? null,
            'tipo' => \App\Enums\TipoMensajeWhatsApp::Enviado,
            'contenido' => $request->input('mensaje'),
            'enviado_at' => now(),
            'leido' => true,
            'es_bot' => false,
            'respuesta_a_id' => $respuestaAId,
            'respuesta_a_contenido' => $respuestaAContenido,
            'respuesta_a_tipo' => $respuestaATipo,
        ]);

        return response()->json(['status' => 'ok']);
    }

    /**
     * Marcar mensajes como leidos.
     */
    public function marcarLeidos(WhatsAppContacto $contacto): JsonResponse
    {
        $contacto->mensajes()
            ->where('leido', false)
            ->update(['leido' => true]);

        return response()->json(['status' => 'ok']);
    }

    /**
     * Obtener lista de contactos de WhatsApp.
     */
    public function contactos(): JsonResponse
    {
        $contactos = $this->evolutionApi->obtenerContactos();

        return response()->json($contactos);
    }

    /**
     * Sincronizar chats y mensajes desde Evolution API.
     */
    public function sincronizar(): JsonResponse
    {
        $chats = $this->evolutionApi->obtenerChats();
        $sincronizados = 0;
        $mensajesSincronizados = 0;

        // Primero, fusionar contactos @lid con sus equivalentes de teléfono
        $this->fusionarContactosLid();

        foreach ($chats as $chat) {
            // Solo sincronizar chats individuales con teléfono (no @lid ni grupos)
            if (!str_ends_with($chat['remoteJid'], '@s.whatsapp.net')) {
                continue;
            }

            if ($chat['remoteJid'] === '0@s.whatsapp.net') {
                continue;
            }

            $contacto = WhatsAppContacto::buscarOCrear($chat['remoteJid'], [
                'nombre' => $chat['pushName'] ?: WhatsAppContacto::extraerTelefono($chat['remoteJid']),
                'avatar' => $chat['profilePicUrl'] ?? null,
                'en_linea' => false,
            ]);

            // Obtener timestamp del último mensaje sincronizado para este contacto
            $ultimoMensaje = WhatsAppMensaje::where('contacto_id', $contacto->id)
                ->orderByDesc('enviado_at')
                ->first();
            $desdeTimestamp = $ultimoMensaje?->enviado_at?->timestamp;

            // Usar paginación para traer todos los mensajes (o solo los nuevos)
            $mensajes = $this->evolutionApi->obtenerTodosLosMensajes(
                $chat['remoteJid'],
                $desdeTimestamp
            );

            $nuevos = $this->guardarMensajes($contacto, $mensajes);
            $mensajesSincronizados += $nuevos;
            $sincronizados++;
        }

        return response()->json([
            'status' => 'ok',
            'chats_sincronizados' => $sincronizados,
            'mensajes_sincronizados' => $mensajesSincronizados,
        ]);
    }

    /**
     * Guardar mensajes de la API en la BD, retorna cantidad de nuevos.
     *
     * @param  array<int, array<string, mixed>>  $mensajes
     */
    private function guardarMensajes(WhatsAppContacto $contacto, array $mensajes): int
    {
        $nuevos = 0;

        foreach ($mensajes as $msg) {
            $whatsappMessageId = $msg['key']['id'] ?? null;

            if ($whatsappMessageId && WhatsAppMensaje::where('whatsapp_id', $whatsappMessageId)->exists()) {
                continue;
            }

            $message = $msg['message'] ?? [];
            $mediaTipo = $this->determinarTipoMedia($message);
            $contenido = $this->extraerContenido($msg);

            if (!$contenido) {
                continue;
            }

            // Solo descargar media para mensajes recientes (< 1 hora)
            $mediaUrl = null;
            $enviadoAt = isset($msg['messageTimestamp'])
                ? \Carbon\Carbon::createFromTimestamp($msg['messageTimestamp'])
                : now();
            $esReciente = $enviadoAt->gt(now()->subHour());

            if ($whatsappMessageId && $mediaTipo && $mediaTipo !== 'texto' && $esReciente) {
                $mediaUrl = $this->descargarMedia($whatsappMessageId, $mediaTipo, $message);
            }

            // Extraer datos de cita (contextInfo) si existe
            $respuestaData = $this->extraerDatosRespuesta($msg);

            WhatsAppMensaje::create([
                'contacto_id' => $contacto->id,
                'whatsapp_id' => $whatsappMessageId,
                'tipo' => ($msg['key']['fromMe'] ?? false)
                    ? \App\Enums\TipoMensajeWhatsApp::Enviado
                    : \App\Enums\TipoMensajeWhatsApp::Recibido,
                'contenido' => $contenido,
                'media_url' => $mediaUrl,
                'media_tipo' => $mediaTipo !== 'texto' ? $mediaTipo : null,
                'enviado_at' => $enviadoAt,
                'leido' => true,
                'es_bot' => false,
                'respuesta_a_id' => $respuestaData['id'],
                'respuesta_a_contenido' => $respuestaData['contenido'],
                'respuesta_a_tipo' => $respuestaData['tipo'],
            ]);

            $nuevos++;
        }

        return $nuevos;
    }

    /**
     * Fusionar contactos @lid con sus equivalentes de teléfono.
     * WhatsApp usa @lid (Linked ID) además de @s.whatsapp.net para el mismo contacto.
     */
    private function fusionarContactosLid(): void
    {
        $contactosLid = WhatsAppContacto::where('whatsapp_id', 'LIKE', '%@lid')->get();

        foreach ($contactosLid as $contactoLid) {
            /** @var WhatsAppContacto $contactoLid */

            // 1. Buscar contacto real que ya tiene este lid_id mapeado
            /** @var WhatsAppContacto|null $contactoReal */
            $contactoReal = WhatsAppContacto::where('lid_id', $contactoLid->whatsapp_id)
                ->where('id', '!=', $contactoLid->id)
                ->first();

            // 2. Buscar contacto real por nombre
            if (!$contactoReal) {
                $contactoReal = WhatsAppContacto::where('nombre', $contactoLid->nombre)
                    ->where('whatsapp_id', 'NOT LIKE', '%@lid')
                    ->where('id', '!=', $contactoLid->id)
                    ->first();
            }

            if ($contactoReal) {
                Log::channel('whatsapp')->info('Fusionando contacto @lid', [
                    'lid_id' => $contactoLid->id,
                    'lid_jid' => $contactoLid->whatsapp_id,
                    'real_id' => $contactoReal->id,
                    'real_telefono' => $contactoReal->telefono,
                    'nombre' => $contactoLid->nombre,
                ]);

                $contactoReal->fusionarDesde($contactoLid);
            }
        }
    }

    /**
     * Extraer datos de respuesta/cita de un mensaje de WhatsApp.
     *
     * @return array{id: string|null, contenido: string|null, tipo: string|null}
     */
    private function extraerDatosRespuesta(array $msg): array
    {
        $message = $msg['message'] ?? [];
        $contextInfo = $message['extendedTextMessage']['contextInfo']
            ?? $message['imageMessage']['contextInfo']
            ?? $message['videoMessage']['contextInfo']
            ?? $message['audioMessage']['contextInfo']
            ?? $message['documentMessage']['contextInfo']
            ?? null;

        if (!$contextInfo || empty($contextInfo['stanzaId'])) {
            return ['id' => null, 'contenido' => null, 'tipo' => null];
        }

        $quotedMessage = $contextInfo['quotedMessage'] ?? [];
        $quotedContent = $quotedMessage['conversation']
            ?? $quotedMessage['extendedTextMessage']['text']
            ?? $quotedMessage['imageMessage']['caption']
            ?? '[Media]';

        // Determinar si el mensaje citado fue enviado por nosotros
        $participant = $contextInfo['participant'] ?? null;
        $remoteJid = $msg['key']['remoteJid'] ?? '';
        $quotedFromMe = $participant !== null && $participant !== $remoteJid;

        return [
            'id' => $contextInfo['stanzaId'],
            'contenido' => mb_substr($quotedContent, 0, 500),
            'tipo' => $quotedFromMe ? 'enviado' : 'recibido',
        ];
    }

    /**
     * Extraer contenido legible de un mensaje de WhatsApp.
     */
    private function extraerContenido(array $msg): ?string
    {
        $message = $msg['message'] ?? [];

        // Mensaje de texto simple
        if (isset($message['conversation'])) {
            return $message['conversation'];
        }

        // Mensaje extendido (con contexto)
        if (isset($message['extendedTextMessage']['text'])) {
            return $message['extendedTextMessage']['text'];
        }

        // Imagen con caption
        if (isset($message['imageMessage'])) {
            return $message['imageMessage']['caption'] ?? '[Imagen]';
        }

        // Video con caption
        if (isset($message['videoMessage'])) {
            return $message['videoMessage']['caption'] ?? '[Video]';
        }

        // Audio
        if (isset($message['audioMessage'])) {
            return '[Audio]';
        }

        // Documento
        if (isset($message['documentMessage'])) {
            return '[Documento: ' . ($message['documentMessage']['fileName'] ?? 'archivo') . ']';
        }

        // Sticker
        if (isset($message['stickerMessage'])) {
            return '[Sticker]';
        }

        // Ubicación
        if (isset($message['locationMessage'])) {
            return '[Ubicación]';
        }

        // Contacto
        if (isset($message['contactMessage'])) {
            return '[Contacto: ' . ($message['contactMessage']['displayName'] ?? 'contacto') . ']';
        }

        return null;
    }

    /**
     * Determinar el tipo de media de un mensaje.
     */
    private function determinarTipoMedia(array $message): string
    {
        if (isset($message['imageMessage'])) {
            return 'imagen';
        }

        if (isset($message['videoMessage'])) {
            return 'video';
        }

        if (isset($message['audioMessage'])) {
            return 'audio';
        }

        if (isset($message['documentMessage'])) {
            return 'documento';
        }

        if (isset($message['stickerMessage'])) {
            return 'sticker';
        }

        return 'texto';
    }

    /**
     * Descargar y guardar media.
     */
    private function descargarMedia(string $messageId, string $mediaTipo, array $message): ?string
    {
        try {
            $mediaData = $this->evolutionApi->descargarMedia($messageId, $mediaTipo);

            if (!$mediaData || empty($mediaData['base64'])) {
                return null;
            }

            $base64 = $mediaData['base64'];
            $mimeType = $mediaData['mimetype'] ?? $this->getMimeTypeDefault($mediaTipo);
            $extension = $this->getExtension($mimeType, $mediaTipo, $message);

            $fileName = 'whatsapp/' . date('Y/m/') . \Illuminate\Support\Str::uuid() . '.' . $extension;

            /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
            $disk = \Illuminate\Support\Facades\Storage::disk('public');
            $disk->put($fileName, base64_decode($base64));

            return asset('storage/' . $fileName);
        } catch (\Exception $e) {
            Log::channel('whatsapp')->error('Error al descargar media en sync', [
                'messageId' => $messageId,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Obtener mime type por defecto.
     */
    private function getMimeTypeDefault(string $mediaTipo): string
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
     * Obtener extensión del archivo.
     */
    private function getExtension(string $mimeType, string $mediaTipo, array $message): string
    {
        if ($mediaTipo === 'documento' && isset($message['documentMessage']['fileName'])) {
            $ext = pathinfo($message['documentMessage']['fileName'], PATHINFO_EXTENSION);
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
            'audio/ogg' => 'ogg',
            'audio/mpeg' => 'mp3',
            'application/pdf' => 'pdf',
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
     * Limpiar todos los datos de WhatsApp (mensajes + contactos) y desconectar.
     * Útil para iniciar sesión con una cuenta diferente.
     */
    public function limpiarDatos(): JsonResponse
    {
        // Desconectar primero
        $this->evolutionApi->desconectar();

        // Limpiar caches
        cache()->forget('whatsapp_qrcode');
        cache()->forget('whatsapp_connection_state');
        Cache::forget('whatsapp_estado_conexion');

        // Borrar todos los mensajes y contactos
        WhatsAppMensaje::query()->delete();
        WhatsAppContacto::query()->delete();

        Log::channel('whatsapp')->info('Datos de WhatsApp limpiados (mensajes y contactos eliminados)');

        return response()->json(['status' => 'ok']);
    }

    /**
     * Iniciar nueva conversacion.
     */
    public function nuevoChat(Request $request): JsonResponse
    {
        $request->validate([
            'telefono' => ['required', 'string', 'min:10', 'max:15'],
            'nombre' => ['nullable', 'string', 'max:255'],
            'mensaje' => ['required', 'string', 'max:4096'],
        ]);

        $telefono = preg_replace('/[^0-9]/', '', $request->input('telefono'));

        // Buscar contacto existente por teléfono (con o sin código de país)
        $contacto = WhatsAppContacto::where('telefono', $telefono)
            ->orWhere('telefono', 'LIKE', '%' . $telefono)
            ->first();

        if (!$contacto) {
            $jid = $telefono . '@s.whatsapp.net';
            $contacto = WhatsAppContacto::buscarOCrear($jid, [
                'nombre' => $request->input('nombre') ?? $telefono,
                'en_linea' => false,
            ]);
        }

        // Enviar mensaje
        $resultado = $this->evolutionApi->enviarTexto($telefono, $request->input('mensaje'));

        if (isset($resultado['error'])) {
            return response()->json(['error' => $resultado['message']], 500);
        }

        // Guardar mensaje
        WhatsAppMensaje::create([
            'contacto_id' => $contacto->id,
            'whatsapp_id' => $resultado['key']['id'] ?? null,
            'tipo' => \App\Enums\TipoMensajeWhatsApp::Enviado,
            'contenido' => $request->input('mensaje'),
            'enviado_at' => now(),
            'leido' => true,
            'es_bot' => false,
        ]);

        return response()->json([
            'status' => 'ok',
            'contacto_id' => $contacto->id,
        ]);
    }

    private function normalizarBase64Qr(string $base64): string
    {
        if (str_starts_with($base64, 'data:')) {
            return $base64;
        }

        return 'data:image/png;base64,'.$base64;
    }
}
