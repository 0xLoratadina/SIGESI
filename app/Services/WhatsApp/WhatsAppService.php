<?php

namespace App\Services\WhatsApp;

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
        $contactos = WhatsAppContacto::with(['mensajes' => fn ($q) => $q->orderBy('enviado_at')])->get();

        $resultado = [];
        foreach ($contactos as $contacto) {
            $resultado[(string) $contacto->id] = $contacto->mensajes
                ->map(fn (WhatsAppMensaje $mensaje) => $this->formatearMensaje($mensaje))
                ->all();
        }

        return $resultado;
    }

    /**
     * Obtener tickets asociados a cada chat.
     *
     * @return array<string, array<int, array<string, mixed>>>
     */
    public function getTicketsPorChat(): array
    {
        // TODO: Implementar relacion con tickets reales
        return [];
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
            'ultimo_mensaje_at' => $ultimoMensaje?->enviado_at,
            'no_leidos' => $contacto->mensajesNoLeidos(),
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
            'tipo' => $mensaje->tipo->value,
            'contenido' => $mensaje->contenido,
            'hora' => $mensaje->enviado_at->format('H:i'),
            'leido' => $mensaje->leido,
            'es_bot' => $mensaje->es_bot,
        ];
    }
}
