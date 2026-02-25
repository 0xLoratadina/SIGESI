<?php

namespace App\Http\Controllers;

use App\Enums\EstadoTicket;
use App\Http\Requests\ActualizarTicketRequest;
use App\Http\Requests\CrearTicketRequest;
use App\Models\Adjunto;
use App\Models\Categoria;
use App\Models\Prioridad;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TicketController extends Controller
{
    public function show(Request $request, Ticket $ticket): JsonResponse
    {
        $usuario = $request->user();

        if ($usuario->esSolicitante() && $ticket->solicitante_id !== $usuario->id) {
            abort(Response::HTTP_FORBIDDEN);
        }

        if ($usuario->esAuxiliar() && $ticket->auxiliar_id !== $usuario->id) {
            abort(Response::HTTP_FORBIDDEN);
        }

        $ticket->load([
            'solicitante:id,name,email',
            'auxiliar:id,name,email',
            'area:id,nombre',
            'categoria:id,nombre',
            'prioridad:id,nombre,color,nivel',
            'ubicacion:id,nombre,edificio,piso',
            'adjuntos:id,ticket_id,nombre,tamano,tipo_mime',
        ]);

        return response()->json($ticket);
    }

    public function update(ActualizarTicketRequest $request, Ticket $ticket): JsonResponse
    {
        $datos = $request->validated();

        if (isset($datos['auxiliar_id']) && $datos['auxiliar_id'] != $ticket->auxiliar_id) {
            $datos['asignado_por'] = $request->user()->id;
            $datos['fecha_asignacion'] = now();

            if ($ticket->estado === EstadoTicket::Abierto && ! isset($datos['estado'])) {
                $datos['estado'] = EstadoTicket::Asignado;
            }
        }

        if (isset($datos['estado'])) {
            $estado = $datos['estado'] instanceof EstadoTicket
                ? $datos['estado']
                : EstadoTicket::from($datos['estado']);

            if ($estado === EstadoTicket::Resuelto && ! $ticket->fecha_resolucion) {
                $datos['fecha_resolucion'] = now();
            }

            if ($estado === EstadoTicket::Cerrado && ! $ticket->fecha_cierre) {
                $datos['fecha_cierre'] = now();
            }
        }

        if (isset($datos['prioridad_id']) && $datos['prioridad_id'] != $ticket->prioridad_id) {
            $prioridad = Prioridad::find($datos['prioridad_id']);
            if ($prioridad && $prioridad->horas_resolucion) {
                $datos['fecha_limite'] = now()->addHours($prioridad->horas_resolucion);
            }
        }

        $ticket->update($datos);

        $ticket->load([
            'solicitante:id,name,email',
            'auxiliar:id,name,email',
            'area:id,nombre',
            'categoria:id,nombre',
            'prioridad:id,nombre,color,nivel',
            'ubicacion:id,nombre,edificio,piso',
            'adjuntos:id,ticket_id,nombre,tamano,tipo_mime',
        ]);

        return response()->json($ticket);
    }

    public function store(CrearTicketRequest $request): RedirectResponse
    {
        $datos = $request->safe()->except('adjuntos');

        $datos['creador_id'] = $request->user()->id;
        $datos['estado'] = EstadoTicket::Abierto;

        if (! $request->user()->esAdmin()) {
            $datos['solicitante_id'] = $request->user()->id;
        }

        $solicitante = User::find($datos['solicitante_id']);
        $datos['area_id'] = $datos['area_id'] ?? $solicitante?->area_id;
        $datos['categoria_id'] = $datos['categoria_id'] ?? Categoria::query()->where('activo', true)->value('id');
        $datos['prioridad_id'] = $datos['prioridad_id'] ?? Prioridad::query()->where('activo', true)->orderByDesc('nivel')->value('id');

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
