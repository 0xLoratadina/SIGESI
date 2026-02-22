<?php

use App\Models\Area;
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

it('auxiliar recibe 403', function () {
    $auxiliar = User::factory()->auxiliar()->create();

    $this->actingAs($auxiliar)
        ->get(route('admin.catalogos'))
        ->assertForbidden();
});

it('pagina incluye areas y auxiliares', function () {
    $admin = User::factory()->administrador()->create();
    Area::factory()->create();

    $this->actingAs($admin)
        ->get(route('admin.catalogos'))
        ->assertInertia(fn ($pagina) => $pagina
            ->component('admin/catalogos')
            ->has('areas')
            ->has('auxiliares')
        );
});
