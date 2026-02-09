<?php

use App\Models\Categoria;
use App\Models\Departamento;
use App\Models\Prioridad;
use App\Models\Ubicacion;
use App\Models\User;

it('admin puede ver la pagina de catalogos', function () {
    $admin = User::factory()->administrador()->create();

    $this->actingAs($admin)
        ->get(route('admin.catalogos'))
        ->assertSuccessful()
        ->assertInertia(fn ($pagina) => $pagina->component('admin/catalogos'));
});

it('solicitante recibe 403', function () {
    $solicitante = User::factory()->solicitante()->create();

    $this->actingAs($solicitante)
        ->get(route('admin.catalogos'))
        ->assertForbidden();
});

it('tecnico recibe 403', function () {
    $tecnico = User::factory()->tecnico()->create();

    $this->actingAs($tecnico)
        ->get(route('admin.catalogos'))
        ->assertForbidden();
});

it('pagina incluye todos los catalogos', function () {
    $admin = User::factory()->administrador()->create();
    Departamento::factory()->create();
    Categoria::factory()->create();
    Prioridad::factory()->create();
    Ubicacion::factory()->create();

    $this->actingAs($admin)
        ->get(route('admin.catalogos'))
        ->assertInertia(fn ($pagina) => $pagina
            ->component('admin/catalogos')
            ->has('departamentos')
            ->has('categorias')
            ->has('prioridades')
            ->has('ubicaciones')
        );
});
