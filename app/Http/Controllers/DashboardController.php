<?php

namespace App\Http\Controllers;

use App\Enums\EstadoTicket;
use App\Enums\Rol;
use App\Models\Area;
use App\Models\Categoria;
use App\Models\Prioridad;
use App\Models\Ticket;
use App\Models\Ubicacion;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $usuario = $request->user();

        $consulta = match ($usuario->rol) {
            Rol::Administrador => Ticket::query(),
            Rol::Auxiliar => Ticket::query()->where('auxiliar_id', $usuario->id),
            Rol::Solicitante => Ticket::query()->where('solicitante_id', $usuario->id),
        };

        $conteosPorEstado = (clone $consulta)
            ->selectRaw('estado, count(*) as total')
            ->groupBy('estado')
            ->pluck('total', 'estado');

        $estadisticas = [
            'total' => $conteosPorEstado->sum(),
            'abiertos' => $conteosPorEstado->get(EstadoTicket::Abierto->value, 0),
            'en_progreso' => $conteosPorEstado->only([
                EstadoTicket::Asignado->value,
                EstadoTicket::EnProgreso->value,
                EstadoTicket::EnEspera->value,
            ])->sum(),
            'resueltos' => $conteosPorEstado->only([
                EstadoTicket::Resuelto->value,
                EstadoTicket::Cerrado->value,
            ])->sum(),
        ];

        $filtroEstado = $request->query('estado');
        if ($filtroEstado && EstadoTicket::tryFrom($filtroEstado)) {
            $consulta->where('estado', $filtroEstado);
        }

        $tickets = $consulta
            ->with([
                'solicitante:id,name',
                'auxiliar:id,name',
                'prioridad:id,nombre,color',
                'categoria:id,nombre',
            ])
            ->latest()
            ->get();

        return Inertia::render('dashboard', [
            'estadisticas' => $estadisticas,
            'tickets' => $tickets,
            'filtroEstado' => $filtroEstado,
            'estados' => array_column(EstadoTicket::cases(), 'value'),
            'catalogos' => Inertia::defer(fn () => [
                'areas' => Area::query()->where('activo', true)->select('id', 'nombre')->orderBy('nombre')->get(),
                'categorias' => Categoria::query()->where('activo', true)->select('id', 'nombre', 'padre_id')->orderBy('nombre')->get(),
                'prioridades' => Prioridad::query()->where('activo', true)->select('id', 'nombre', 'color', 'nivel')->orderBy('nivel')->get(),
                'ubicaciones' => Ubicacion::query()->where('activo', true)->select('id', 'nombre', 'edificio', 'piso', 'area_id')->orderBy('nombre')->get(),
                'auxiliares' => $usuario->esAdmin()
                    ? User::query()->where('activo', true)->where('rol', Rol::Auxiliar)->select('id', 'name')->orderBy('name')->get()
                    : [],
                'usuarios' => $usuario->esAdmin()
                    ? User::query()->where('activo', true)->select('id', 'name', 'email', 'area_id')->orderBy('name')->get()
                    : [],
            ]),
        ]);
    }
}
