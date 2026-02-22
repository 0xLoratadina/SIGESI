<?php

use App\Models\Area;
use App\Models\Ticket;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->administrador()->create();
    $this->auxiliar = User::factory()->auxiliar()->create();
    $this->solicitante = User::factory()->solicitante()->create();
});

it('invitados no pueden crear areas', function () {
    $this->post(route('admin.areas.store'), [
        'nombre' => 'Soporte',
    ])->assertRedirect(route('login'));
});

it('solicitante no puede crear area', function () {
    $this->actingAs($this->solicitante)
        ->post(route('admin.areas.store'), [
            'nombre' => 'Soporte',
        ])->assertForbidden();
});

it('auxiliar no puede crear area', function () {
    $this->actingAs($this->auxiliar)
        ->post(route('admin.areas.store'), [
            'nombre' => 'Soporte',
        ])->assertForbidden();
});

it('admin puede crear area', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.areas.store'), [
            'nombre' => 'Soporte Técnico',
            'edificio' => 'Edificio A',
            'nivel_prioridad' => 2,
        ])->assertRedirect();

    $this->assertDatabaseHas('areas', [
        'nombre' => 'Soporte Técnico',
        'edificio' => 'Edificio A',
        'nivel_prioridad' => 2,
        'activo' => true,
    ]);
});

it('validacion rechaza nombre vacio', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.areas.store'), [
            'nombre' => '',
        ])->assertSessionHasErrors('nombre');
});

it('validacion rechaza nombre duplicado', function () {
    Area::factory()->create(['nombre' => 'Soporte']);

    $this->actingAs($this->admin)
        ->post(route('admin.areas.store'), [
            'nombre' => 'Soporte',
        ])->assertSessionHasErrors('nombre');
});

it('admin puede actualizar area', function () {
    $area = Area::factory()->create(['nombre' => 'Original']);

    $this->actingAs($this->admin)
        ->put(route('admin.areas.update', $area), [
            'nombre' => 'Actualizado',
        ])->assertRedirect();

    expect($area->fresh()->nombre)->toBe('Actualizado');
});

it('admin puede desactivar area', function () {
    $area = Area::factory()->create(['activo' => true]);

    $this->actingAs($this->admin)
        ->put(route('admin.areas.update', $area), [
            'nombre' => $area->nombre,
            'activo' => false,
        ])->assertRedirect();

    expect($area->fresh()->activo)->toBeFalse();
});

it('admin puede eliminar area sin dependencias', function () {
    $area = Area::factory()->create();

    $this->actingAs($this->admin)
        ->delete(route('admin.areas.destroy', $area))
        ->assertRedirect();

    $this->assertDatabaseMissing('areas', ['id' => $area->id]);
});

it('no se puede eliminar area con tickets', function () {
    $area = Area::factory()->create();
    Ticket::factory()->create(['area_id' => $area->id]);

    $this->actingAs($this->admin)
        ->delete(route('admin.areas.destroy', $area))
        ->assertSessionHasErrors('general');

    $this->assertDatabaseHas('areas', ['id' => $area->id]);
});
