<?php

namespace App\Services\WhatsApp;

use App\Models\Ticket;
use App\Models\User;
use App\Models\WhatsAppContacto;
use App\Models\WhatsAppMensaje;

class WhatsAppService
{
    /**
     * Estado de conexion del servicio de WhatsApp.
     *
     * @return string 'desconectado' | 'conectando' | 'conectado'
     */
    public function getEstadoConexion(): string
    {
        // TODO: Implementar conexion real con WhatsApp Business API
        return 'conectado';
    }

    /**
     * Obtener lista de chats formateados para el frontend.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getChats(): array
    {
        return WhatsAppContacto::query()
            ->with(['mensajes' => fn ($q) => $q->latest('enviado_at')->limit(1)])
            ->withCount(['mensajes as no_leidos' => fn ($q) => $q->where('tipo', 'recibido')->where('leido', false)])
            ->get()
            ->map(fn (WhatsAppContacto $contacto) => $this->formatearContacto($contacto))
            ->sortByDesc('ultimo_mensaje_at')
            ->values()
            ->all();
    }

    /**
     * Obtener mensajes agrupados por contacto ID.
     *
     * @return array<string, array<int, array<string, mixed>>>
     */
    public function getMensajesPorChat(): array
    {
        $contactos = WhatsAppContacto::with([
            'mensajes' => fn ($q) => $q->orderByDesc('enviado_at')->limit(50),
        ])->get();

        $resultado = [];
        foreach ($contactos as $contacto) {
            $resultado[(string) $contacto->id] = $contacto->mensajes
                ->reverse()
                ->values()
                ->map(fn (WhatsAppMensaje $mensaje) => $this->formatearMensaje($mensaje))
                ->all();
        }

        return $resultado;
    }

    /**
     * Obtener tickets asociados a cada chat (vinculados por teléfono del contacto → usuario).
     *
     * @return array<string, array<int, array<string, mixed>>>
     */
    public function getTicketsPorChat(): array
    {
        $contactos = WhatsAppContacto::all();
        $resultado = [];

        $coloresEstado = [
            'Abierto' => 'yellow',
            'Asignado' => 'blue',
            'EnProgreso' => 'blue',
            'EnEspera' => 'yellow',
            'Resuelto' => 'green',
            'Cerrado' => 'green',
            'Cancelado' => 'red',
        ];

        foreach ($contactos as $contacto) {
            $usuario = $this->buscarUsuarioPorTelefono($contacto->telefono);

            if (! $usuario) {
                $resultado[(string) $contacto->id] = [];

                continue;
            }

            $tickets = Ticket::where('solicitante_id', $usuario->id)
                ->latest()
                ->limit(10)
                ->get(['id', 'numero', 'titulo', 'estado']);

            $resultado[(string) $contacto->id] = $tickets->map(fn (Ticket $t) => [
                'id' => $t->id,
                'numero' => $t->numero,
                'titulo' => $t->titulo,
                'estado' => $t->estado->etiqueta(),
                'color_estado' => $coloresEstado[$t->estado->value] ?? 'gray',
            ])->all();
        }

        return $resultado;
    }

    private function buscarUsuarioPorTelefono(string $telefono): ?User
    {
        $limpio = preg_replace('/[^0-9]/', '', $telefono);

        return User::where('activo', true)
            ->where(function ($q) use ($telefono, $limpio) {
                $q->where('telefono', $telefono)
                    ->orWhere('telefono', $limpio)
                    ->orWhere('whatsapp_telefono', $telefono)
                    ->orWhere('whatsapp_telefono', $limpio);

                if (str_starts_with($limpio, '52') && strlen($limpio) > 10) {
                    $q->orWhere('telefono', substr($limpio, 2))
                        ->orWhere('whatsapp_telefono', substr($limpio, 2));
                }
                if (str_starts_with($limpio, '521') && strlen($limpio) > 10) {
                    $q->orWhere('telefono', substr($limpio, 3))
                        ->orWhere('whatsapp_telefono', substr($limpio, 3));
                }
            })
            ->first();
    }

    /**
     * Formatear contacto para el frontend.
     *
     * @return array<string, mixed>
     */
    private function formatearContacto(WhatsAppContacto $contacto): array
    {
        $ultimoMensaje = $contacto->mensajes->first();

        return [
            'id' => (string) $contacto->id,
            'nombre' => $contacto->nombre,
            'telefono' => $contacto->telefono,
            'avatar' => $contacto->avatar,
            'ultimo_mensaje' => $ultimoMensaje?->contenido ?? '',
            'hora_ultimo' => $ultimoMensaje?->enviado_at->format('H:i') ?? '',
            'ultimo_mensaje_at' => $ultimoMensaje?->enviado_at?->toISOString(),
            'no_leidos' => $contacto->no_leidos ?? $contacto->mensajesNoLeidos(),
            'en_linea' => $contacto->en_linea,
            'estado_ticket' => $contacto->estado_ticket->value,
        ];
    }

    /**
     * Formatear mensaje para el frontend.
     *
     * @return array<string, mixed>
     */
    private function formatearMensaje(WhatsAppMensaje $mensaje): array
    {
        return [
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
}
