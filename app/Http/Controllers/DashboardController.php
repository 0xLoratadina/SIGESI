<?php

namespace App\Http\Controllers;

use App\Enums\Canal;
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

        $estadisticas = [
            'total' => (clone $consulta)->count(),
            'abiertos' => (clone $consulta)->where('estado', EstadoTicket::Abierto)->count(),
            'en_progreso' => (clone $consulta)->whereIn('estado', [
                EstadoTicket::Asignado,
                EstadoTicket::EnProgreso,
                EstadoTicket::EnEspera,
            ])->count(),
            'resueltos' => (clone $consulta)->whereIn('estado', [
                EstadoTicket::Resuelto,
                EstadoTicket::Cerrado,
            ])->count(),
        ];

        $filtroEstado = $request->query('estado');
        if ($filtroEstado && EstadoTicket::tryFrom($filtroEstado)) {
            $consulta->where('estado', $filtroEstado);
        }

        $porPagina = (int) $request->query('por_pagina', 15);
        $porPagina = in_array($porPagina, [10, 15]) ? $porPagina : 15;

        $tickets = $consulta
            ->with([
                'solicitante:id,name',
                'auxiliar:id,name',
                'prioridad:id,nombre,color',
                'categoria:id,nombre',
            ])
            ->latest()
            ->paginate($porPagina)
            ->withQueryString();

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
                'canales' => array_column(Canal::cases(), 'value'),
                'usuarios' => $usuario->esAdmin()
                    ? User::query()->where('activo', true)->select('id', 'name', 'email')->orderBy('name')->get()
                    : [],
            ]),
        ]);
    }
}
