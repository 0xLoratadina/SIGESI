<?php

use App\Enums\EstadoTicket;
use App\Models\Categoria;
use App\Models\Departamento;
use App\Models\Prioridad;
use App\Models\Ticket;
use App\Models\User;

test('invitados son redirigidos al login', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

test('usuario autenticado puede ver el dashboard', function () {
    $this->actingAs(User::factory()->create());

    $this->get(route('dashboard'))->assertSuccessful();
});

test('admin ve todos los tickets', function () {
    $admin = User::factory()->administrador()->create();
    $departamento = Departamento::factory()->create();
    $categoria = Categoria::factory()->create();
    $prioridad = Prioridad::factory()->create();

    Ticket::factory()->count(3)->create([
        'departamento_id' => $departamento->id,
        'categoria_id' => $categoria->id,
        'prioridad_id' => $prioridad->id,
    ]);

    $this->actingAs($admin);
    $respuesta = $this->get(route('dashboard'));

    $respuesta->assertSuccessful();
    expect($respuesta->original->getData()['page']['props']['estadisticas']['total'])->toBe(3);
});

test('tecnico solo ve sus tickets asignados', function () {
    $tecnico = User::factory()->tecnico()->create();
    $otroTecnico = User::factory()->tecnico()->create();
    $departamento = Departamento::factory()->create();
    $categoria = Categoria::factory()->create();
    $prioridad = Prioridad::factory()->create();

    $datosComunes = [
        'departamento_id' => $departamento->id,
        'categoria_id' => $categoria->id,
        'prioridad_id' => $prioridad->id,
    ];

    Ticket::factory()->count(2)->create([...$datosComunes, 'tecnico_id' => $tecnico->id]);
    Ticket::factory()->create([...$datosComunes, 'tecnico_id' => $otroTecnico->id]);

    $this->actingAs($tecnico);
    $respuesta = $this->get(route('dashboard'));

    expect($respuesta->original->getData()['page']['props']['estadisticas']['total'])->toBe(2);
});

test('solicitante solo ve sus tickets', function () {
    $solicitante = User::factory()->solicitante()->create();
    $otro = User::factory()->solicitante()->create();
    $departamento = Departamento::factory()->create();
    $categoria = Categoria::factory()->create();
    $prioridad = Prioridad::factory()->create();

    $datosComunes = [
        'departamento_id' => $departamento->id,
        'categoria_id' => $categoria->id,
        'prioridad_id' => $prioridad->id,
    ];

    Ticket::factory()->count(2)->create([...$datosComunes, 'solicitante_id' => $solicitante->id]);
    Ticket::factory()->create([...$datosComunes, 'solicitante_id' => $otro->id]);

    $this->actingAs($solicitante);
    $respuesta = $this->get(route('dashboard'));

    expect($respuesta->original->getData()['page']['props']['estadisticas']['total'])->toBe(2);
});

test('dashboard filtra tickets por estado', function () {
    $admin = User::factory()->administrador()->create();
    $departamento = Departamento::factory()->create();
    $categoria = Categoria::factory()->create();
    $prioridad = Prioridad::factory()->create();

    $datosComunes = [
        'departamento_id' => $departamento->id,
        'categoria_id' => $categoria->id,
        'prioridad_id' => $prioridad->id,
    ];

    Ticket::factory()->count(2)->create([...$datosComunes, 'estado' => EstadoTicket::Abierto]);
    Ticket::factory()->create([...$datosComunes, 'estado' => EstadoTicket::EnProgreso]);

    $this->actingAs($admin);
    $respuesta = $this->get(route('dashboard', ['estado' => 'Abierto']));

    $tickets = $respuesta->original->getData()['page']['props']['tickets']['data'];
    expect(count($tickets))->toBe(2);
});
