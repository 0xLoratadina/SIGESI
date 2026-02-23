<?php

use App\Enums\EstadoTicket;
use App\Models\Area;
use App\Models\Categoria;
use App\Models\Prioridad;
use App\Models\Ticket;
use App\Models\Ubicacion;
use App\Models\User;

function crearTicketConRelaciones(array $atributos = []): Ticket
{
    return Ticket::factory()->create([
        'area_id' => Area::factory(),
        'categoria_id' => Categoria::factory(),
        'prioridad_id' => Prioridad::factory(),
        ...$atributos,
    ]);
}

// ── Show ──────────────────────────────────────────

test('invitados no pueden ver tickets', function () {
    $ticket = crearTicketConRelaciones();

    $this->getJson(route('tickets.show', $ticket))->assertUnauthorized();
});

test('admin puede ver cualquier ticket', function () {
    $admin = User::factory()->administrador()->create();
    $ticket = crearTicketConRelaciones();

    $this->actingAs($admin);

    $this->getJson(route('tickets.show', $ticket))
        ->assertSuccessful()
        ->assertJsonPath('id', $ticket->id)
        ->assertJsonPath('numero', $ticket->numero);
});

test('solicitante puede ver su propio ticket', function () {
    $solicitante = User::factory()->solicitante()->create();
    $ticket = crearTicketConRelaciones(['solicitante_id' => $solicitante->id]);

    $this->actingAs($solicitante);

    $this->getJson(route('tickets.show', $ticket))
        ->assertSuccessful()
        ->assertJsonPath('id', $ticket->id);
});

test('solicitante no puede ver ticket de otro', function () {
    $solicitante = User::factory()->solicitante()->create();
    $ticket = crearTicketConRelaciones();

    $this->actingAs($solicitante);

    $this->getJson(route('tickets.show', $ticket))->assertForbidden();
});

test('auxiliar puede ver ticket asignado', function () {
    $auxiliar = User::factory()->auxiliar()->create();
    $ticket = crearTicketConRelaciones(['auxiliar_id' => $auxiliar->id]);

    $this->actingAs($auxiliar);

    $this->getJson(route('tickets.show', $ticket))
        ->assertSuccessful()
        ->assertJsonPath('id', $ticket->id);
});

test('auxiliar no puede ver ticket no asignado', function () {
    $auxiliar = User::factory()->auxiliar()->create();
    $ticket = crearTicketConRelaciones();

    $this->actingAs($auxiliar);

    $this->getJson(route('tickets.show', $ticket))->assertForbidden();
});

test('respuesta incluye relaciones cargadas', function () {
    $admin = User::factory()->administrador()->create();
    $ubicacion = Ubicacion::factory()->create();
    $ticket = crearTicketConRelaciones(['ubicacion_id' => $ubicacion->id]);

    $this->actingAs($admin);

    $this->getJson(route('tickets.show', $ticket))
        ->assertSuccessful()
        ->assertJsonStructure([
            'id',
            'numero',
            'titulo',
            'descripcion',
            'estado',
            'created_at',
            'solicitante' => ['id', 'name', 'email'],
            'area' => ['id', 'nombre'],
            'categoria' => ['id', 'nombre'],
            'prioridad' => ['id', 'nombre', 'color', 'nivel'],
            'ubicacion' => ['id', 'nombre'],
            'adjuntos',
        ]);
});

// ── Update ────────────────────────────────────────

test('admin puede actualizar estado de un ticket', function () {
    $admin = User::factory()->administrador()->create();
    $ticket = crearTicketConRelaciones(['estado' => EstadoTicket::Abierto]);

    $this->actingAs($admin);

    $this->putJson(route('tickets.update', $ticket), [
        'estado' => EstadoTicket::EnProgreso->value,
    ])
        ->assertSuccessful()
        ->assertJsonPath('estado', EstadoTicket::EnProgreso->value);
});

test('admin puede asignar auxiliar a un ticket', function () {
    $admin = User::factory()->administrador()->create();
    $auxiliar = User::factory()->auxiliar()->create();
    $ticket = crearTicketConRelaciones(['estado' => EstadoTicket::Abierto]);

    $this->actingAs($admin);

    $respuesta = $this->putJson(route('tickets.update', $ticket), [
        'auxiliar_id' => $auxiliar->id,
    ])->assertSuccessful();

    $respuesta->assertJsonPath('auxiliar_id', $auxiliar->id);
    $respuesta->assertJsonPath('asignado_por', $admin->id);
    $respuesta->assertJsonPath('estado', EstadoTicket::Asignado->value);
});

test('admin puede cambiar prioridad de un ticket', function () {
    $admin = User::factory()->administrador()->create();
    $nuevaPrioridad = Prioridad::factory()->create(['horas_resolucion' => 8]);
    $ticket = crearTicketConRelaciones();

    $this->actingAs($admin);

    $this->putJson(route('tickets.update', $ticket), [
        'prioridad_id' => $nuevaPrioridad->id,
    ])
        ->assertSuccessful()
        ->assertJsonPath('prioridad_id', $nuevaPrioridad->id);

    expect(Ticket::find($ticket->id)->fecha_limite)->not->toBeNull();
});

test('solicitante no puede actualizar ticket', function () {
    $solicitante = User::factory()->solicitante()->create();
    $ticket = crearTicketConRelaciones(['solicitante_id' => $solicitante->id]);

    $this->actingAs($solicitante);

    $this->putJson(route('tickets.update', $ticket), [
        'estado' => EstadoTicket::Resuelto->value,
    ])->assertForbidden();
});

test('auxiliar no puede actualizar ticket', function () {
    $auxiliar = User::factory()->auxiliar()->create();
    $ticket = crearTicketConRelaciones(['auxiliar_id' => $auxiliar->id]);

    $this->actingAs($auxiliar);

    $this->putJson(route('tickets.update', $ticket), [
        'estado' => EstadoTicket::Resuelto->value,
    ])->assertForbidden();
});

test('marcar como resuelto establece fecha_resolucion', function () {
    $admin = User::factory()->administrador()->create();
    $ticket = crearTicketConRelaciones(['estado' => EstadoTicket::EnProgreso]);

    $this->actingAs($admin);

    $this->putJson(route('tickets.update', $ticket), [
        'estado' => EstadoTicket::Resuelto->value,
    ])->assertSuccessful();

    expect(Ticket::find($ticket->id)->fecha_resolucion)->not->toBeNull();
});

test('marcar como cerrado establece fecha_cierre', function () {
    $admin = User::factory()->administrador()->create();
    $ticket = crearTicketConRelaciones(['estado' => EstadoTicket::Resuelto]);

    $this->actingAs($admin);

    $this->putJson(route('tickets.update', $ticket), [
        'estado' => EstadoTicket::Cerrado->value,
    ])->assertSuccessful();

    expect(Ticket::find($ticket->id)->fecha_cierre)->not->toBeNull();
});
