<?php

namespace App\Services\WhatsApp;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EvolutionApiService
{
    private string $baseUrl;

    private string $apiKey;

    private string $instanceName;

    public function __construct()
    {
        $this->baseUrl = config('services.evolution.url', 'http://localhost:8085');
        $this->apiKey = config('services.evolution.api_key', '');
        $this->instanceName = config('services.evolution.instance_name', 'sigesi');
    }

    /**
     * Crear cliente HTTP configurado.
     */
    private function client(): PendingRequest
    {
        return Http::baseUrl($this->baseUrl)
            ->withHeaders(['apikey' => $this->apiKey])
            ->timeout(10)
            ->connectTimeout(5)
            ->acceptJson();
    }

    /**
     * Cliente HTTP con timeout mayor para operaciones de media.
     */
    private function clientMedia(): PendingRequest
    {
        return Http::baseUrl($this->baseUrl)
            ->withHeaders(['apikey' => $this->apiKey])
            ->timeout(15)
            ->connectTimeout(5)
            ->acceptJson();
    }

    /**
     * Crear instancia de WhatsApp.
     *
     * @return array<string, mixed>
     */
    public function crearInstancia(): array
    {
        $response = $this->client()->post('/instance/create', [
            'instanceName' => $this->instanceName,
            'qrcode' => true,
            'integration' => 'WHATSAPP-BAILEYS',
        ]);

        if ($response->failed()) {
            Log::channel('whatsapp')->error('Error al crear instancia', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return ['error' => true, 'message' => 'Error al crear instancia'];
        }

        return $response->json();
    }

    /**
     * Obtener estado de la instancia.
     *
     * @return array<string, mixed>
     */
    public function obtenerEstado(): array
    {
        $response = $this->client()->get("/instance/connectionState/{$this->instanceName}");

        if ($response->failed()) {
            return ['state' => 'close'];
        }

        return $response->json();
    }

    /**
     * Obtener QR code para conectar.
     *
     * @return array<string, mixed>|null
     */
    public function obtenerQrCode(): ?array
    {
        $response = $this->client()->get("/instance/qrcode/{$this->instanceName}");

        if ($response->failed()) {
            return null;
        }

        return $response->json();
    }

    /**
     * Desconectar instancia.
     */
    public function desconectar(): bool
    {
        $response = $this->client()->delete("/instance/logout/{$this->instanceName}");

        return $response->successful();
    }

    /**
     * Enviar mensaje de texto.
     *
     * @return array<string, mixed>
     */
    public function enviarTexto(string $telefono, string $mensaje): array
    {
        $response = $this->client()->post("/message/sendText/{$this->instanceName}", [
            'number' => $this->formatearTelefono($telefono),
            'text' => $mensaje,
        ]);

        if ($response->failed()) {
            Log::channel('whatsapp')->error('Error al enviar mensaje', [
                'telefono' => $telefono,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return ['error' => true, 'message' => 'Error al enviar mensaje'];
        }

        return $response->json();
    }

    /**
     * Enviar imagen.
     *
     * @return array<string, mixed>
     */
    public function enviarImagen(string $telefono, string $imageUrl, ?string $caption = null): array
    {
        $response = $this->client()->post("/message/sendMedia/{$this->instanceName}", [
            'number' => $this->formatearTelefono($telefono),
            'mediatype' => 'image',
            'media' => $imageUrl,
            'caption' => $caption,
        ]);

        if ($response->failed()) {
            return ['error' => true, 'message' => 'Error al enviar imagen'];
        }

        return $response->json();
    }

    /**
     * Verificar si está conectado.
     */
    public function estaConectado(): bool
    {
        $estado = $this->obtenerEstado();

        return ($estado['instance']['state'] ?? 'close') === 'open';
    }

    /**
     * Obtener lista de contactos de WhatsApp.
     *
     * @return array<int, array<string, mixed>>
     */
    public function obtenerContactos(): array
    {
        $response = $this->client()->post("/chat/findContacts/{$this->instanceName}", []);

        if ($response->failed()) {
            Log::channel('whatsapp')->error('Error al obtener contactos', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [];
        }

        $contactos = $response->json() ?? [];

        // Filtrar solo contactos válidos (con número de teléfono)
        return collect($contactos)
            ->filter(fn ($c) => isset($c['remoteJid']) && str_ends_with($c['remoteJid'], '@s.whatsapp.net'))
            ->map(fn ($c) => [
                'id' => $c['id'] ?? null,
                'telefono' => str_replace('@s.whatsapp.net', '', $c['remoteJid']),
                'nombre' => $c['pushName'] ?? str_replace('@s.whatsapp.net', '', $c['remoteJid']),
                'foto' => $c['profilePicUrl'] ?? null,
            ])
            ->values()
            ->toArray();
    }

    /**
     * Obtener lista de chats existentes.
     *
     * @return array<int, array<string, mixed>>
     */
    public function obtenerChats(): array
    {
        $response = $this->client()->post("/chat/findChats/{$this->instanceName}", []);

        if ($response->failed()) {
            Log::channel('whatsapp')->error('Error al obtener chats', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [];
        }

        return $response->json() ?? [];
    }

    /**
     * Obtener mensajes de un chat específico.
     *
     * @return array<string, mixed>
     */
    public function obtenerMensajes(string $remoteJid, int $limit = 50): array
    {
        $response = $this->client()->post("/chat/findMessages/{$this->instanceName}", [
            'where' => [
                'key' => [
                    'remoteJid' => $remoteJid,
                ],
            ],
            'limit' => $limit,
        ]);

        if ($response->failed()) {
            Log::channel('whatsapp')->error('Error al obtener mensajes', [
                'remoteJid' => $remoteJid,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return ['messages' => ['records' => []]];
        }

        return $response->json() ?? ['messages' => ['records' => []]];
    }

    /**
     * Obtener TODOS los mensajes de un chat con paginación.
     *
     * @return array<int, array<string, mixed>>
     */
    public function obtenerTodosLosMensajes(string $remoteJid, ?int $desdeTimestamp = null): array
    {
        $todosLosMensajes = [];
        $pagina = 0;
        $limit = 100;
        $maxPaginas = 20;

        while ($pagina < $maxPaginas) {
            $body = [
                'where' => [
                    'key' => [
                        'remoteJid' => $remoteJid,
                    ],
                ],
                'limit' => $limit,
                'page' => $pagina,
            ];

            $response = $this->client()->post("/chat/findMessages/{$this->instanceName}", $body);

            if ($response->failed()) {
                Log::channel('whatsapp')->error('Error al obtener mensajes (paginado)', [
                    'remoteJid' => $remoteJid,
                    'pagina' => $pagina,
                    'status' => $response->status(),
                ]);

                break;
            }

            $data = $response->json() ?? [];
            $mensajes = $data['messages']['records'] ?? $data ?? [];

            if (empty($mensajes)) {
                break;
            }

            // Si hay timestamp mínimo, filtrar mensajes viejos
            if ($desdeTimestamp) {
                $mensajes = array_filter($mensajes, function ($msg) use ($desdeTimestamp) {
                    $msgTimestamp = $msg['messageTimestamp'] ?? 0;

                    return $msgTimestamp > $desdeTimestamp;
                });

                // Si todos los mensajes de esta página son viejos, parar
                if (empty($mensajes)) {
                    break;
                }
            }

            $todosLosMensajes = array_merge($todosLosMensajes, array_values($mensajes));

            // Si recibimos menos del límite, no hay más páginas
            $totalRecibidos = count($data['messages']['records'] ?? $data ?? []);
            if ($totalRecibidos < $limit) {
                break;
            }

            $pagina++;
        }

        return $todosLosMensajes;
    }

    /**
     * Formatear teléfono para WhatsApp.
     */
    private function formatearTelefono(string $telefono): string
    {
        $telefono = preg_replace('/[^0-9]/', '', $telefono);

        if (! str_starts_with($telefono, '52') && strlen($telefono) === 10) {
            $telefono = '52'.$telefono;
        }

        return $telefono;
    }

    /**
     * Configurar webhook para recibir eventos.
     *
     * @return array<string, mixed>
     */
    public function configurarWebhook(string $webhookUrl): array
    {
        $response = $this->client()->post("/webhook/set/{$this->instanceName}", [
            'url' => $webhookUrl,
            'webhookByEvents' => false,
            'webhookBase64' => true,
            'events' => [
                'MESSAGES_UPSERT',
                'CONNECTION_UPDATE',
                'QRCODE_UPDATED',
            ],
        ]);

        if ($response->failed()) {
            Log::channel('whatsapp')->error('Error al configurar webhook', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return ['error' => true, 'message' => 'Error al configurar webhook'];
        }

        Log::channel('whatsapp')->info('Webhook configurado', [
            'url' => $webhookUrl,
            'response' => $response->json(),
        ]);

        return $response->json();
    }

    /**
     * Descargar media de un mensaje (base64).
     *
     * @return array<string, mixed>|null
     */
    public function descargarMedia(string $messageId, string $mediaType): ?array
    {
        $response = $this->clientMedia()->post("/chat/getBase64FromMediaMessage/{$this->instanceName}", [
            'message' => [
                'key' => [
                    'id' => $messageId,
                ],
            ],
            'convertToMp4' => $mediaType === 'video',
        ]);

        if ($response->failed()) {
            Log::channel('whatsapp')->error('Error al descargar media', [
                'messageId' => $messageId,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        }

        return $response->json();
    }
}
