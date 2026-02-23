<?php

use App\Enums\EstadoTicket;
use App\Models\Actividad;
use App\Models\Area;
use App\Models\Categoria;
use App\Models\Comentario;
use App\Models\Prioridad;
use App\Models\Ticket;
use App\Models\Ubicacion;
use App\Models\User;

it('pertenece a solicitante, creador, auxiliar, area, categoria y prioridad', function () {
    $area = Area::factory()->create();
    $categoria = Categoria::factory()->create();
    $prioridad = Prioridad::factory()->create();
    $ubicacion = Ubicacion::factory()->create(['area_id' => $area->id]);
    $solicitante = User::factory()->create();
    $auxiliar = User::factory()->auxiliar()->create();

    $ticket = Ticket::factory()->create([
        'solicitante_id' => $solicitante->id,
        'creador_id' => $solicitante->id,
        'area_id' => $area->id,
        'categoria_id' => $categoria->id,
        'prioridad_id' => $prioridad->id,
        'ubicacion_id' => $ubicacion->id,
        'auxiliar_id' => $auxiliar->id,
    ]);

    expect($ticket->solicitante->id)->toBe($solicitante->id)
        ->and($ticket->creador->id)->toBe($solicitante->id)
        ->and($ticket->auxiliar->id)->toBe($auxiliar->id)
        ->and($ticket->area->id)->toBe($area->id)
        ->and($ticket->categoria->id)->toBe($categoria->id)
        ->and($ticket->prioridad->id)->toBe($prioridad->id)
        ->and($ticket->ubicacion->id)->toBe($ubicacion->id);
});

it('tiene comentarios y actividades', function () {
    $ticket = Ticket::factory()->create();

    Comentario::factory()->create(['ticket_id' => $ticket->id]);
    Actividad::factory()->create(['ticket_id' => $ticket->id]);

    expect($ticket->comentarios)->toHaveCount(1)
        ->and($ticket->actividades)->toHaveCount(1);
});

it('castea estado como enum', function () {
    $ticket = Ticket::factory()->create([
        'estado' => EstadoTicket::EnProgreso,
    ]);

    expect($ticket->estado)->toBe(EstadoTicket::EnProgreso);
});

it('crea ticket con factory state asignado', function () {
    $ticket = Ticket::factory()->asignado()->create();

    expect($ticket->estado)->toBe(EstadoTicket::Asignado)
        ->and($ticket->auxiliar_id)->not->toBeNull()
        ->and($ticket->fecha_asignacion)->not->toBeNull();
});

it('crea ticket con factory state resuelto', function () {
    $ticket = Ticket::factory()->resuelto()->create();

    expect($ticket->estado)->toBe(EstadoTicket::Resuelto)
        ->and($ticket->solucion)->not->toBeNull()
        ->and($ticket->fecha_resolucion)->not->toBeNull();
});
