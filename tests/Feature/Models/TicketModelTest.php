<?php

use App\Enums\Canal;
use App\Enums\EstadoTicket;
use App\Models\Actividad;
use App\Models\Categoria;
use App\Models\Comentario;
use App\Models\Departamento;
use App\Models\Prioridad;
use App\Models\Ticket;
use App\Models\Ubicacion;
use App\Models\User;

it('pertenece a solicitante, creador, tecnico, departamento, categoria y prioridad', function () {
    $departamento = Departamento::factory()->create();
    $categoria = Categoria::factory()->create();
    $prioridad = Prioridad::factory()->create();
    $ubicacion = Ubicacion::factory()->create(['departamento_id' => $departamento->id]);
    $solicitante = User::factory()->create();
    $tecnico = User::factory()->tecnico()->create();

    $ticket = Ticket::factory()->create([
        'solicitante_id' => $solicitante->id,
        'creador_id' => $solicitante->id,
        'departamento_id' => $departamento->id,
        'categoria_id' => $categoria->id,
        'prioridad_id' => $prioridad->id,
        'ubicacion_id' => $ubicacion->id,
        'tecnico_id' => $tecnico->id,
    ]);

    expect($ticket->solicitante->id)->toBe($solicitante->id)
        ->and($ticket->creador->id)->toBe($solicitante->id)
        ->and($ticket->tecnico->id)->toBe($tecnico->id)
        ->and($ticket->departamento->id)->toBe($departamento->id)
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

it('castea canal y estado como enums', function () {
    $ticket = Ticket::factory()->create([
        'canal' => Canal::WhatsApp,
        'estado' => EstadoTicket::EnProgreso,
    ]);

    expect($ticket->canal)->toBe(Canal::WhatsApp)
        ->and($ticket->estado)->toBe(EstadoTicket::EnProgreso);
});

it('crea ticket con factory state asignado', function () {
    $ticket = Ticket::factory()->asignado()->create();

    expect($ticket->estado)->toBe(EstadoTicket::Asignado)
        ->and($ticket->tecnico_id)->not->toBeNull()
        ->and($ticket->fecha_asignacion)->not->toBeNull();
});

it('crea ticket con factory state resuelto', function () {
    $ticket = Ticket::factory()->resuelto()->create();

    expect($ticket->estado)->toBe(EstadoTicket::Resuelto)
        ->and($ticket->solucion)->not->toBeNull()
        ->and($ticket->fecha_resolucion)->not->toBeNull();
});
