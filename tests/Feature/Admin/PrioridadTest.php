<?php

use App\Models\Prioridad;
use App\Models\Ticket;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->administrador()->create();
    $this->solicitante = User::factory()->solicitante()->create();
});

it('solo admin puede crear prioridad', function () {
    $this->actingAs($this->solicitante)
        ->post(route('admin.prioridades.store'), [
            'nombre' => 'Critica',
            'color' => '#DC2626',
            'horas_respuesta' => 1,
            'horas_resolucion' => 4,
            'nivel' => 1,
        ])->assertForbidden();
});

it('admin puede crear prioridad', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.prioridades.store'), [
            'nombre' => 'Critica',
            'color' => '#DC2626',
            'horas_respuesta' => 1,
            'horas_resolucion' => 4,
            'nivel' => 1,
        ])->assertRedirect();

    $this->assertDatabaseHas('prioridades', [
        'nombre' => 'Critica',
        'color' => '#DC2626',
        'horas_respuesta' => 1,
        'horas_resolucion' => 4,
        'nivel' => 1,
        'activo' => true,
    ]);
});

it('validacion rechaza color invalido', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.prioridades.store'), [
            'nombre' => 'Test',
            'color' => 'rojo',
            'horas_respuesta' => 1,
            'horas_resolucion' => 4,
            'nivel' => 1,
        ])->assertSessionHasErrors('color');
});

it('validacion rechaza horas negativas', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.prioridades.store'), [
            'nombre' => 'Test',
            'color' => '#DC2626',
            'horas_respuesta' => 0,
            'horas_resolucion' => -1,
            'nivel' => 1,
        ])->assertSessionHasErrors(['horas_respuesta', 'horas_resolucion']);
});

it('validacion rechaza nombre duplicado', function () {
    Prioridad::factory()->create(['nombre' => 'Critica']);

    $this->actingAs($this->admin)
        ->post(route('admin.prioridades.store'), [
            'nombre' => 'Critica',
            'color' => '#FF0000',
            'horas_respuesta' => 2,
            'horas_resolucion' => 8,
            'nivel' => 2,
        ])->assertSessionHasErrors('nombre');
});

it('validacion rechaza nivel duplicado', function () {
    Prioridad::factory()->create(['nivel' => 1]);

    $this->actingAs($this->admin)
        ->post(route('admin.prioridades.store'), [
            'nombre' => 'Nueva',
            'color' => '#FF0000',
            'horas_respuesta' => 2,
            'horas_resolucion' => 8,
            'nivel' => 1,
        ])->assertSessionHasErrors('nivel');
});

it('admin puede actualizar prioridad', function () {
    $prioridad = Prioridad::factory()->create([
        'nombre' => 'Original',
        'color' => '#000000',
        'horas_respuesta' => 2,
        'horas_resolucion' => 8,
        'nivel' => 1,
    ]);

    $this->actingAs($this->admin)
        ->put(route('admin.prioridades.update', $prioridad), [
            'nombre' => 'Actualizada',
            'color' => '#FF0000',
            'horas_respuesta' => 4,
            'horas_resolucion' => 16,
            'nivel' => 1,
        ])->assertRedirect();

    $prioridad->refresh();
    expect($prioridad->nombre)->toBe('Actualizada')
        ->and($prioridad->color)->toBe('#FF0000')
        ->and($prioridad->horas_resolucion)->toBe(16);
});

it('admin puede eliminar prioridad sin tickets', function () {
    $prioridad = Prioridad::factory()->create();

    $this->actingAs($this->admin)
        ->delete(route('admin.prioridades.destroy', $prioridad))
        ->assertRedirect();

    $this->assertDatabaseMissing('prioridades', ['id' => $prioridad->id]);
});

it('no se puede eliminar prioridad con tickets', function () {
    $prioridad = Prioridad::factory()->create();
    Ticket::factory()->create(['prioridad_id' => $prioridad->id]);

    $this->actingAs($this->admin)
        ->delete(route('admin.prioridades.destroy', $prioridad))
        ->assertSessionHasErrors('general');

    $this->assertDatabaseHas('prioridades', ['id' => $prioridad->id]);
});
