<?php

use App\Enums\Rol;
use App\Models\Area;
use App\Models\Categoria;
use App\Models\Ticket;
use App\Models\User;

it('pertenece a un area', function () {
    $area = Area::factory()->create();
    $usuario = User::factory()->create(['area_id' => $area->id]);

    expect($usuario->area->id)->toBe($area->id);
});

it('tiene helpers de rol correctos', function () {
    $admin = User::factory()->administrador()->create();
    $auxiliar = User::factory()->auxiliar()->create();
    $solicitante = User::factory()->solicitante()->create();

    expect($admin->esAdmin())->toBeTrue()
        ->and($admin->esAuxiliar())->toBeFalse()
        ->and($auxiliar->esAuxiliar())->toBeTrue()
        ->and($auxiliar->esAdmin())->toBeFalse()
        ->and($solicitante->esSolicitante())->toBeTrue()
        ->and($solicitante->esAuxiliar())->toBeFalse();
});

it('tiene tickets como solicitante', function () {
    $usuario = User::factory()->create();
    $area = Area::factory()->create();
    $categoria = Categoria::factory()->create();

    Ticket::factory()->create([
        'solicitante_id' => $usuario->id,
        'area_id' => $area->id,
        'categoria_id' => $categoria->id,
    ]);

    expect($usuario->ticketsSolicitados)->toHaveCount(1);
});

it('tiene tickets como auxiliar asignado', function () {
    $auxiliar = User::factory()->auxiliar()->create();

    Ticket::factory()->create(['auxiliar_id' => $auxiliar->id]);

    expect($auxiliar->ticketsAsignados)->toHaveCount(1);
});

it('tiene categorias de especialidad', function () {
    $auxiliar = User::factory()->auxiliar()->create();
    $categorias = Categoria::factory()->count(3)->create();

    $auxiliar->categoriasEspecialidad()->attach($categorias->pluck('id'));

    expect($auxiliar->categoriasEspecialidad)->toHaveCount(3);
});

it('castea el rol como enum', function () {
    $usuario = User::factory()->administrador()->create();

    expect($usuario->rol)->toBeInstanceOf(Rol::class)
        ->and($usuario->rol)->toBe(Rol::Administrador);
});
