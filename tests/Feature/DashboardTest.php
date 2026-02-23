<?php

use App\Enums\EstadoTicket;
use App\Models\Area;
use App\Models\Categoria;
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
    $area = Area::factory()->create();
    $categoria = Categoria::factory()->create();
    $prioridad = Prioridad::factory()->create();

    Ticket::factory()->count(3)->create([
        'area_id' => $area->id,
        'categoria_id' => $categoria->id,
        'prioridad_id' => $prioridad->id,
    ]);

    $this->actingAs($admin);
    $respuesta = $this->get(route('dashboard'));

    $respuesta->assertSuccessful();
    expect($respuesta->original->getData()['page']['props']['estadisticas']['total'])->toBe(3);
});

test('auxiliar solo ve sus tickets asignados', function () {
    $auxiliar = User::factory()->auxiliar()->create();
    $otroAuxiliar = User::factory()->auxiliar()->create();
    $area = Area::factory()->create();
    $categoria = Categoria::factory()->create();
    $prioridad = Prioridad::factory()->create();

    $datosComunes = [
        'area_id' => $area->id,
        'categoria_id' => $categoria->id,
        'prioridad_id' => $prioridad->id,
    ];

    Ticket::factory()->count(2)->create([...$datosComunes, 'auxiliar_id' => $auxiliar->id]);
    Ticket::factory()->create([...$datosComunes, 'auxiliar_id' => $otroAuxiliar->id]);

    $this->actingAs($auxiliar);
    $respuesta = $this->get(route('dashboard'));

    expect($respuesta->original->getData()['page']['props']['estadisticas']['total'])->toBe(2);
});

test('solicitante solo ve sus tickets', function () {
    $solicitante = User::factory()->solicitante()->create();
    $otro = User::factory()->solicitante()->create();
    $area = Area::factory()->create();
    $categoria = Categoria::factory()->create();
    $prioridad = Prioridad::factory()->create();

    $datosComunes = [
        'area_id' => $area->id,
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
    $area = Area::factory()->create();
    $categoria = Categoria::factory()->create();
    $prioridad = Prioridad::factory()->create();

    $datosComunes = [
        'area_id' => $area->id,
        'categoria_id' => $categoria->id,
        'prioridad_id' => $prioridad->id,
    ];

    Ticket::factory()->count(2)->create([...$datosComunes, 'estado' => EstadoTicket::Abierto]);
    Ticket::factory()->create([...$datosComunes, 'estado' => EstadoTicket::EnProgreso]);

    $this->actingAs($admin);
    $respuesta = $this->get(route('dashboard', ['estado' => 'Abierto']));

    $tickets = $respuesta->original->getData()['page']['props']['tickets'];
    expect(count($tickets))->toBe(2);
});
