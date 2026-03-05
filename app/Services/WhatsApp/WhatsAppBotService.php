<?php

namespace App\Services\WhatsApp;

use App\Enums\EstadoTicket;
use App\Enums\EstadoTicketChat;
use App\Enums\TipoMensajeWhatsApp;
use App\Models\Area;
use App\Models\Categoria;
use App\Models\Prioridad;
use App\Models\Ticket;
use App\Models\Ubicacion;
use App\Models\User;
use App\Models\WhatsAppContacto;
use App\Models\WhatsAppMensaje;
use App\Services\GroqService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class WhatsAppBotService
{
    public function __construct(
        private GroqService $groq,
        private EvolutionApiService $evolutionApi,
    ) {}

    /**
     * Procesar un mensaje recibido y responder automáticamente si corresponde.
     */
    public function procesarMensaje(WhatsAppContacto $contacto, WhatsAppMensaje $mensaje): void
    {
        if ($mensaje->tipo !== TipoMensajeWhatsApp::Recibido || $mensaje->es_bot) {
            return;
        }

        // Solo texto: ignorar media sin contenido útil
        if (in_array($mensaje->contenido, ['[Imagen]', '[Video]', '[Audio]', '[Sticker]'])) {
            return;
        }

        try {
            match ($contacto->estado_ticket) {
                EstadoTicketChat::SinTicket,
                EstadoTicketChat::Cerrado => $this->analizarNuevaSolicitud($contacto, $mensaje),
                EstadoTicketChat::Pendiente => $this->procesarConfirmacion($contacto, $mensaje),
                EstadoTicketChat::EnProceso => null,
            };
        } catch (\Exception $e) {
            Log::channel('whatsapp')->error('Error en bot WhatsApp', [
                'contacto_id' => $contacto->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Analizar si el mensaje es una solicitud de soporte y extraer datos.
     */
    private function analizarNuevaSolicitud(WhatsAppContacto $contacto, WhatsAppMensaje $mensaje): void
    {
        $textoMensaje = $mensaje->contenido;

        $catalogos = $this->obtenerCatalogos();
        $analisis = $this->analizarConIA($textoMensaje, $contacto->nombre, $catalogos);

        if (! $analisis || ! ($analisis['es_solicitud'] ?? false)) {
            $this->enviarMensajeBot($contacto, 'Hola, soy el asistente del Centro de Datos del ITESCO. Si tienes un problema técnico, descríbelo con detalle (qué equipo, dónde, qué ocurre) y te ayudaré a crear un ticket de soporte.');

            return;
        }

        Cache::put("ticket_pendiente_{$contacto->id}", $analisis, now()->addHour());

        $resumen = $this->construirResumenConfirmacion($analisis, $catalogos);
        $this->enviarMensajeBot($contacto, $resumen);

        $contacto->update(['estado_ticket' => EstadoTicketChat::Pendiente]);
    }

    /**
     * Procesar respuesta del usuario cuando hay un ticket pendiente de confirmación.
     */
    private function procesarConfirmacion(WhatsAppContacto $contacto, WhatsAppMensaje $mensaje): void
    {
        $contenido = mb_strtolower(trim($mensaje->contenido));

        $afirmaciones = ['sí', 'si', 'yes', 'correcto', 'ok', 'sip', 'confirmo', 'dale', 'va', 'claro'];
        $negaciones = ['no', 'cancelar', 'cancel', 'nel', 'nop', 'nope'];

        if (in_array($contenido, $afirmaciones, true)) {
            $datos = Cache::pull("ticket_pendiente_{$contacto->id}");

            if (! $datos) {
                $this->enviarMensajeBot($contacto, 'La solicitud expiró. Por favor, describe nuevamente tu problema.');
                $contacto->update(['estado_ticket' => EstadoTicketChat::SinTicket]);

                return;
            }

            $ticket = $this->crearTicketDesdeAnalisis($contacto, $datos);

            if ($ticket) {
                $this->enviarMensajeBot($contacto,
                    "Ticket *{$ticket->numero}* creado exitosamente.\n\n".
                    "_{$ticket->titulo}_\n\n".
                    'Un auxiliar será asignado pronto. Te notificaremos cuando haya novedades.'
                );
                $contacto->update(['estado_ticket' => EstadoTicketChat::EnProceso]);
            } else {
                $this->enviarMensajeBot($contacto, 'Hubo un error al crear el ticket. Por favor, intenta de nuevo o contacta directamente al Centro de Datos.');
                $contacto->update(['estado_ticket' => EstadoTicketChat::SinTicket]);
            }

            return;
        }

        if (in_array($contenido, $negaciones, true)) {
            Cache::forget("ticket_pendiente_{$contacto->id}");
            $this->enviarMensajeBot($contacto, 'Solicitud cancelada. Si necesitas reportar un problema, envíame los detalles.');
            $contacto->update(['estado_ticket' => EstadoTicketChat::SinTicket]);

            return;
        }

        $this->enviarMensajeBot($contacto, 'Por favor responde *sí* para confirmar la creación del ticket o *no* para cancelar.');
    }

    /**
     * Llamar a Groq para analizar el mensaje.
     *
     * @param  array<string, mixed>  $catalogos
     * @return array<string, mixed>|null
     */
    private function analizarConIA(string $mensajes, string $nombreContacto, array $catalogos): ?array
    {
        $categoriasTexto = collect($catalogos['categorias'])
            ->map(fn ($c) => "- ID {$c['id']}: {$c['nombre']}")
            ->implode("\n");

        $prioridadesTexto = collect($catalogos['prioridades'])
            ->map(fn ($p) => "- ID {$p['id']}: {$p['nombre']} (nivel {$p['nivel']}, resolver en {$p['horas_resolucion']}h)")
            ->implode("\n");

        $ubicacionesTexto = collect($catalogos['ubicaciones'])
            ->map(fn ($u) => "- ID {$u['id']}: {$u['nombre']}" . ($u['edificio'] ? " (Edificio {$u['edificio']})" : ''))
            ->implode("\n");

        $systemPrompt = <<<PROMPT
Eres el asistente del Centro de Datos del ITESCO (Instituto Tecnológico Superior de Coatzacoalcos). Analizas mensajes de WhatsApp del personal para determinar si son solicitudes de soporte técnico.

INSTRUCCIONES:
1. Si el mensaje describe un problema técnico, falla de equipo, solicitud de servicio o incidencia de TI, responde con es_solicitud: true.
2. Si es un saludo, pregunta general, conversación casual o algo NO relacionado con soporte técnico, responde con es_solicitud: false.
3. Extrae un título corto y claro del problema (máximo 80 caracteres).
4. Escribe una descripción breve del problema reportado.
5. Elige la categoría más apropiada de la lista disponible.
6. Sugiere una prioridad basándote en la urgencia del mensaje.
7. Si mencionan una ubicación, intenta hacer match con las disponibles.

CATEGORÍAS DISPONIBLES:
{$categoriasTexto}

PRIORIDADES DISPONIBLES:
{$prioridadesTexto}

UBICACIONES DISPONIBLES:
{$ubicacionesTexto}

Responde ÚNICAMENTE con JSON válido con esta estructura:
{
  "es_solicitud": true/false,
  "titulo": "Resumen corto del problema",
  "descripcion": "Descripción del problema reportado",
  "categoria_id": número o null,
  "prioridad_id": número o null,
  "ubicacion_id": número o null,
  "ubicacion_texto": "Ubicación mencionada textualmente o null"
}
PROMPT;

        $userMessage = "Contacto: {$nombreContacto}\nMensajes:\n{$mensajes}";

        return $this->groq->chat([
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $userMessage],
        ]);
    }

    /**
     * Obtener catálogos activos para el prompt de la IA.
     *
     * @return array<string, array<int, array<string, mixed>>>
     */
    private function obtenerCatalogos(): array
    {
        return Cache::remember('bot_catalogos', 300, function () {
            return [
                'categorias' => Categoria::where('activo', true)
                    ->select('id', 'nombre')
                    ->orderBy('nombre')
                    ->get()
                    ->toArray(),
                'prioridades' => Prioridad::where('activo', true)
                    ->select('id', 'nombre', 'nivel', 'horas_resolucion')
                    ->orderBy('nivel')
                    ->get()
                    ->toArray(),
                'ubicaciones' => Ubicacion::where('activo', true)
                    ->select('id', 'nombre', 'edificio', 'piso')
                    ->orderBy('nombre')
                    ->get()
                    ->toArray(),
            ];
        });
    }

    /**
     * Construir el mensaje de confirmación para el usuario.
     *
     * @param  array<string, mixed>  $analisis
     * @param  array<string, mixed>  $catalogos
     */
    private function construirResumenConfirmacion(array $analisis, array $catalogos): string
    {
        $categoria = collect($catalogos['categorias'])->firstWhere('id', $analisis['categoria_id'] ?? null);
        $prioridad = collect($catalogos['prioridades'])->firstWhere('id', $analisis['prioridad_id'] ?? null);

        $lineas = ["Entendí lo siguiente:\n"];
        $lineas[] = "*Problema:* {$analisis['titulo']}";
        $lineas[] = "*Descripción:* {$analisis['descripcion']}";

        if ($categoria) {
            $lineas[] = "*Categoría:* {$categoria['nombre']}";
        }
        if ($prioridad) {
            $lineas[] = "*Prioridad:* {$prioridad['nombre']}";
        }

        $ubicacionTexto = $analisis['ubicacion_texto'] ?? null;
        if ($ubicacionTexto) {
            $lineas[] = "*Ubicación:* {$ubicacionTexto}";
        }

        $lineas[] = "\n¿Es correcto? Responde *sí* para crear el ticket o *no* para cancelar.";

        return implode("\n", $lineas);
    }

    /**
     * Crear un ticket a partir del análisis de la IA.
     *
     * @param  array<string, mixed>  $datos
     */
    private function crearTicketDesdeAnalisis(WhatsAppContacto $contacto, array $datos): ?Ticket
    {
        try {
            $usuario = $this->buscarUsuarioPorTelefono($contacto->telefono);

            $categoriaId = $datos['categoria_id'] ?? Categoria::where('activo', true)->value('id');
            $prioridadId = $datos['prioridad_id'] ?? Prioridad::where('activo', true)->orderByDesc('nivel')->value('id');

            $prioridad = Prioridad::find($prioridadId);

            $ticketData = [
                'titulo' => $datos['titulo'] ?? 'Solicitud vía WhatsApp',
                'descripcion' => $datos['descripcion'] ?? $datos['titulo'] ?? 'Solicitud reportada por WhatsApp',
                'categoria_id' => $categoriaId,
                'prioridad_id' => $prioridadId,
                'ubicacion_id' => $datos['ubicacion_id'] ?? $usuario?->ubicacion_id,
                'estado' => EstadoTicket::Abierto,
                'solicitante_id' => $usuario?->id ?? $this->obtenerUsuarioSistema()->id,
                'creador_id' => $this->obtenerUsuarioSistema()->id,
                'area_id' => $usuario?->area_id ?? Area::where('activo', true)->value('id'),
            ];

            if ($prioridad?->horas_resolucion) {
                $ticketData['fecha_limite'] = now()->addHours($prioridad->horas_resolucion);
            }

            // Si no hay usuario registrado, agregar info de contacto en la descripción
            if (! $usuario) {
                $ticketData['descripcion'] .= "\n\n[Reportado por: {$contacto->nombre} - Tel: {$contacto->telefono} (sin cuenta registrada)]";
            }

            $ticket = Ticket::create($ticketData);

            Log::channel('whatsapp')->info('Ticket creado desde WhatsApp', [
                'ticket_id' => $ticket->id,
                'numero' => $ticket->numero,
                'contacto_id' => $contacto->id,
                'usuario_id' => $usuario?->id,
            ]);

            return $ticket;
        } catch (\Exception $e) {
            Log::channel('whatsapp')->error('Error al crear ticket desde WhatsApp', [
                'contacto_id' => $contacto->id,
                'datos' => $datos,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Buscar usuario registrado por número de teléfono.
     */
    private function buscarUsuarioPorTelefono(string $telefono): ?User
    {
        $telefonoLimpio = preg_replace('/[^0-9]/', '', $telefono);

        return User::where('activo', true)
            ->where(function ($q) use ($telefono, $telefonoLimpio) {
                $q->where('telefono', $telefono)
                    ->orWhere('telefono', $telefonoLimpio)
                    ->orWhere('whatsapp_telefono', $telefono)
                    ->orWhere('whatsapp_telefono', $telefonoLimpio);

                // Intentar sin código de país (52)
                if (str_starts_with($telefonoLimpio, '52') && strlen($telefonoLimpio) > 10) {
                    $sinCodigo = substr($telefonoLimpio, 2);
                    $q->orWhere('telefono', $sinCodigo)
                        ->orWhere('whatsapp_telefono', $sinCodigo);
                }
                if (str_starts_with($telefonoLimpio, '521') && strlen($telefonoLimpio) > 10) {
                    $sinCodigo = substr($telefonoLimpio, 3);
                    $q->orWhere('telefono', $sinCodigo)
                        ->orWhere('whatsapp_telefono', $sinCodigo);
                }
            })
            ->first();
    }

    /**
     * Obtener o crear el usuario del sistema (bot) para asignar como creador.
     */
    private function obtenerUsuarioSistema(): User
    {
        return Cache::remember('usuario_sistema_bot', 3600, function () {
            return User::where('rol', 'Administrador')
                ->where('activo', true)
                ->first() ?? User::first();
        });
    }

    /**
     * Enviar un mensaje como bot vía Evolution API y guardarlo en BD.
     */
    private function enviarMensajeBot(WhatsAppContacto $contacto, string $texto): void
    {
        $telefono = $this->resolverTelefonoReal($contacto);

        if (! $telefono) {
            Log::channel('whatsapp')->error('No se pudo resolver teléfono real para enviar mensaje bot', [
                'contacto_id' => $contacto->id,
                'whatsapp_id' => $contacto->whatsapp_id,
            ]);

            return;
        }

        $resultado = $this->evolutionApi->enviarTexto($telefono, $texto);

        $msg = WhatsAppMensaje::create([
            'contacto_id' => $contacto->id,
            'whatsapp_id' => $resultado['key']['id'] ?? null,
            'tipo' => TipoMensajeWhatsApp::Enviado,
            'contenido' => $texto,
            'enviado_at' => now(),
            'leido' => true,
            'es_bot' => true,
        ]);

        Cache::put('whatsapp_ultimo_msg_id', $msg->id, 3600);
    }

    /**
     * Resolver el teléfono real de un contacto, incluso si solo tiene LID.
     */
    private function resolverTelefonoReal(WhatsAppContacto $contacto): ?string
    {
        if (! str_ends_with($contacto->whatsapp_id, '@lid')) {
            return $contacto->telefono;
        }

        // El contacto tiene LID - buscar contacto con teléfono real
        $contactoReal = WhatsAppContacto::where('lid_id', $contacto->whatsapp_id)
            ->where('whatsapp_id', 'LIKE', '%@s.whatsapp.net')
            ->first();

        if ($contactoReal) {
            return $contactoReal->telefono;
        }

        // Buscar por nombre
        $contactoReal = WhatsAppContacto::where('nombre', $contacto->nombre)
            ->where('whatsapp_id', 'LIKE', '%@s.whatsapp.net')
            ->where('id', '!=', $contacto->id)
            ->first();

        if ($contactoReal) {
            // Vincular para futuras búsquedas
            $contactoReal->update(['lid_id' => $contacto->whatsapp_id]);

            return $contactoReal->telefono;
        }

        Log::channel('whatsapp')->warning('Contacto solo tiene LID, sin teléfono real', [
            'contacto_id' => $contacto->id,
            'lid' => $contacto->whatsapp_id,
        ]);

        return null;
    }
}
