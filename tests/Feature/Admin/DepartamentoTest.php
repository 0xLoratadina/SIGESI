<?php

use App\Models\Departamento;
use App\Models\Ticket;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->administrador()->create();
    $this->tecnico = User::factory()->tecnico()->create();
    $this->solicitante = User::factory()->solicitante()->create();
});

it('invitados no pueden crear departamentos', function () {
    $this->post(route('admin.departamentos.store'), [
        'nombre' => 'Soporte',
        'codigo' => 'SOP',
    ])->assertRedirect(route('login'));
});

it('solicitante no puede crear departamento', function () {
    $this->actingAs($this->solicitante)
        ->post(route('admin.departamentos.store'), [
            'nombre' => 'Soporte',
            'codigo' => 'SOP',
        ])->assertForbidden();
});

it('tecnico no puede crear departamento', function () {
    $this->actingAs($this->tecnico)
        ->post(route('admin.departamentos.store'), [
            'nombre' => 'Soporte',
            'codigo' => 'SOP',
        ])->assertForbidden();
});

it('admin puede crear departamento', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.departamentos.store'), [
            'nombre' => 'Soporte Técnico',
            'codigo' => 'STEC',
            'edificio' => 'Edificio A',
        ])->assertRedirect();

    $this->assertDatabaseHas('departamentos', [
        'nombre' => 'Soporte Técnico',
        'codigo' => 'STEC',
        'edificio' => 'Edificio A',
        'activo' => true,
    ]);
});

it('validacion rechaza nombre vacio', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.departamentos.store'), [
            'nombre' => '',
            'codigo' => 'SOP',
        ])->assertSessionHasErrors('nombre');
});

it('validacion rechaza codigo duplicado', function () {
    Departamento::factory()->create(['codigo' => 'SOP']);

    $this->actingAs($this->admin)
        ->post(route('admin.departamentos.store'), [
            'nombre' => 'Otro Depto',
            'codigo' => 'SOP',
        ])->assertSessionHasErrors('codigo');
});

it('validacion rechaza nombre duplicado', function () {
    Departamento::factory()->create(['nombre' => 'Soporte']);

    $this->actingAs($this->admin)
        ->post(route('admin.departamentos.store'), [
            'nombre' => 'Soporte',
            'codigo' => 'NEW',
        ])->assertSessionHasErrors('nombre');
});

it('admin puede actualizar departamento', function () {
    $depto = Departamento::factory()->create(['nombre' => 'Original']);

    $this->actingAs($this->admin)
        ->put(route('admin.departamentos.update', $depto), [
            'nombre' => 'Actualizado',
            'codigo' => $depto->codigo,
        ])->assertRedirect();

    expect($depto->fresh()->nombre)->toBe('Actualizado');
});

it('admin puede desactivar departamento', function () {
    $depto = Departamento::factory()->create(['activo' => true]);

    $this->actingAs($this->admin)
        ->put(route('admin.departamentos.update', $depto), [
            'nombre' => $depto->nombre,
            'codigo' => $depto->codigo,
            'activo' => false,
        ])->assertRedirect();

    expect($depto->fresh()->activo)->toBeFalse();
});

it('admin puede eliminar departamento sin dependencias', function () {
    $depto = Departamento::factory()->create();

    $this->actingAs($this->admin)
        ->delete(route('admin.departamentos.destroy', $depto))
        ->assertRedirect();

    $this->assertDatabaseMissing('departamentos', ['id' => $depto->id]);
});

it('no se puede eliminar departamento con tickets', function () {
    $depto = Departamento::factory()->create();
    Ticket::factory()->create(['departamento_id' => $depto->id]);

    $this->actingAs($this->admin)
        ->delete(route('admin.departamentos.destroy', $depto))
        ->assertSessionHasErrors('general');

    $this->assertDatabaseHas('departamentos', ['id' => $depto->id]);
});
