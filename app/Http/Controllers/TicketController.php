<?php

namespace App\Http\Controllers;

use App\Enums\Canal;
use App\Enums\EstadoTicket;
use App\Http\Requests\CrearTicketRequest;
use App\Models\Prioridad;
use App\Models\Ticket;
use Illuminate\Http\RedirectResponse;

class TicketController extends Controller
{
    public function store(CrearTicketRequest $request): RedirectResponse
    {
        $datos = $request->validated();

        $datos['creador_id'] = $request->user()->id;
        $datos['estado'] = EstadoTicket::Abierto;
        $datos['canal'] = $datos['canal'] ?? Canal::Web->value;

        if (! $request->user()->esAdmin()) {
            $datos['solicitante_id'] = $request->user()->id;
        }

        $prioridad = Prioridad::find($datos['prioridad_id']);
        if ($prioridad && $prioridad->horas_resolucion) {
            $datos['fecha_limite'] = now()->addHours($prioridad->horas_resolucion);
        }

        Ticket::create($datos);

        return to_route('dashboard');
    }
}
