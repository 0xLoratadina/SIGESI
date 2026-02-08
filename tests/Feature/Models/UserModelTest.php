<?php

use App\Enums\Rol;
use App\Models\Categoria;
use App\Models\Departamento;
use App\Models\Ticket;
use App\Models\User;

it('pertenece a un departamento', function () {
    $departamento = Departamento::factory()->create();
    $usuario = User::factory()->create(['departamento_id' => $departamento->id]);

    expect($usuario->departamento->id)->toBe($departamento->id);
});

it('tiene helpers de rol correctos', function () {
    $admin = User::factory()->administrador()->create();
    $tecnico = User::factory()->tecnico()->create();
    $solicitante = User::factory()->solicitante()->create();

    expect($admin->esAdmin())->toBeTrue()
        ->and($admin->esTecnico())->toBeFalse()
        ->and($tecnico->esTecnico())->toBeTrue()
        ->and($tecnico->esAdmin())->toBeFalse()
        ->and($solicitante->esSolicitante())->toBeTrue()
        ->and($solicitante->esTecnico())->toBeFalse();
});

it('tiene tickets como solicitante', function () {
    $usuario = User::factory()->create();
    $departamento = Departamento::factory()->create();
    $categoria = Categoria::factory()->create();

    Ticket::factory()->create([
        'solicitante_id' => $usuario->id,
        'departamento_id' => $departamento->id,
        'categoria_id' => $categoria->id,
    ]);

    expect($usuario->ticketsSolicitados)->toHaveCount(1);
});

it('tiene tickets como tecnico asignado', function () {
    $tecnico = User::factory()->tecnico()->create();

    Ticket::factory()->create(['tecnico_id' => $tecnico->id]);

    expect($tecnico->ticketsAsignados)->toHaveCount(1);
});

it('tiene especialidades (categorias)', function () {
    $tecnico = User::factory()->tecnico()->create();
    $categorias = Categoria::factory()->count(3)->create();

    $tecnico->especialidades()->attach($categorias->pluck('id'));

    expect($tecnico->especialidades)->toHaveCount(3);
});

it('castea el rol como enum', function () {
    $usuario = User::factory()->administrador()->create();

    expect($usuario->rol)->toBeInstanceOf(Rol::class)
        ->and($usuario->rol)->toBe(Rol::Administrador);
});
