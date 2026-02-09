<?php

use App\Models\Departamento;
use App\Models\Ticket;
use App\Models\Ubicacion;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->administrador()->create();
    $this->solicitante = User::factory()->solicitante()->create();
});

it('solo admin puede crear ubicacion', function () {
    $this->actingAs($this->solicitante)
        ->post(route('admin.ubicaciones.store'), [
            'nombre' => 'Sala de Servidores',
        ])->assertForbidden();
});

it('admin puede crear ubicacion con departamento', function () {
    $depto = Departamento::factory()->create();

    $this->actingAs($this->admin)
        ->post(route('admin.ubicaciones.store'), [
            'nombre' => 'Sala de Servidores',
            'edificio' => 'Edificio Central',
            'piso' => 'Planta Baja',
            'departamento_id' => $depto->id,
        ])->assertRedirect();

    $this->assertDatabaseHas('ubicaciones', [
        'nombre' => 'Sala de Servidores',
        'edificio' => 'Edificio Central',
        'departamento_id' => $depto->id,
    ]);
});

it('admin puede crear ubicacion sin departamento', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.ubicaciones.store'), [
            'nombre' => 'Recepción',
            'edificio' => 'Edificio Principal',
        ])->assertRedirect();

    $this->assertDatabaseHas('ubicaciones', [
        'nombre' => 'Recepción',
        'departamento_id' => null,
    ]);
});

it('validacion rechaza nombre vacio', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.ubicaciones.store'), [
            'nombre' => '',
        ])->assertSessionHasErrors('nombre');
});

it('validacion rechaza departamento_id inexistente', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.ubicaciones.store'), [
            'nombre' => 'Test',
            'departamento_id' => 9999,
        ])->assertSessionHasErrors('departamento_id');
});

it('admin puede actualizar ubicacion', function () {
    $ubi = Ubicacion::factory()->create(['nombre' => 'Original']);

    $this->actingAs($this->admin)
        ->put(route('admin.ubicaciones.update', $ubi), [
            'nombre' => 'Actualizada',
            'edificio' => $ubi->edificio,
        ])->assertRedirect();

    expect($ubi->fresh()->nombre)->toBe('Actualizada');
});

it('admin puede eliminar ubicacion sin tickets', function () {
    $ubi = Ubicacion::factory()->create();

    $this->actingAs($this->admin)
        ->delete(route('admin.ubicaciones.destroy', $ubi))
        ->assertRedirect();

    $this->assertDatabaseMissing('ubicaciones', ['id' => $ubi->id]);
});

it('no se puede eliminar ubicacion con tickets', function () {
    $ubi = Ubicacion::factory()->create();
    Ticket::factory()->create(['ubicacion_id' => $ubi->id]);

    $this->actingAs($this->admin)
        ->delete(route('admin.ubicaciones.destroy', $ubi))
        ->assertSessionHasErrors('general');

    $this->assertDatabaseHas('ubicaciones', ['id' => $ubi->id]);
});
