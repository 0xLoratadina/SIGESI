<?php

namespace App\Http\Controllers;

use App\Enums\Canal;
use App\Enums\EstadoTicket;
use App\Http\Requests\CrearTicketRequest;
use App\Models\Adjunto;
use App\Models\Categoria;
use App\Models\Prioridad;
use App\Models\Ticket;
use Illuminate\Http\RedirectResponse;

class TicketController extends Controller
{
    public function store(CrearTicketRequest $request): RedirectResponse
    {
        $datos = $request->safe()->except('adjuntos');

        $datos['creador_id'] = $request->user()->id;
        $datos['estado'] = EstadoTicket::Abierto;
        $datos['canal'] = $datos['canal'] ?? Canal::Web->value;

        if (! $request->user()->esAdmin()) {
            $datos['solicitante_id'] = $request->user()->id;
        }

        if ($request->user()->esSolicitante()) {
            $datos['area_id'] = $datos['area_id'] ?? $request->user()->area_id;
            $datos['categoria_id'] = $datos['categoria_id'] ?? Categoria::query()->where('activo', true)->value('id');
            $datos['prioridad_id'] = $datos['prioridad_id'] ?? Prioridad::query()->where('activo', true)->orderByDesc('nivel')->value('id');
        }

        $prioridad = Prioridad::find($datos['prioridad_id'] ?? null);
        if ($prioridad && $prioridad->horas_resolucion) {
            $datos['fecha_limite'] = now()->addHours($prioridad->horas_resolucion);
        }

        $ticket = Ticket::create($datos);

        foreach ($request->file('adjuntos', []) as $archivo) {
            $ruta = $archivo->store("adjuntos/tickets/{$ticket->id}", 'local');

            Adjunto::create([
                'ticket_id' => $ticket->id,
                'usuario_id' => $request->user()->id,
                'nombre' => $archivo->getClientOriginalName(),
                'ruta' => $ruta,
                'tamano' => $archivo->getSize(),
                'tipo_mime' => $archivo->getMimeType(),
            ]);
        }

        return to_route('dashboard');
    }
}
