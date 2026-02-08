<?php

namespace App\Http\Controllers;

use App\Enums\EstadoTicket;
use App\Enums\Rol;
use App\Models\Ticket;
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
            Rol::Tecnico => Ticket::query()->where('tecnico_id', $usuario->id),
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
                'tecnico:id,name',
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
        ]);
    }
}
