<?php

use App\Models\HorarioAuxiliar;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->administrador()->create();
    $this->auxiliar = User::factory()->auxiliar()->create();
    $this->solicitante = User::factory()->solicitante()->create();
});

// ── Autorización ───────────────────────────────────────────

it('invitados no pueden actualizar auxiliares', function () {
    $this->put(route('admin.auxiliares.update', $this->auxiliar), [
        'disponible' => false,
    ])->assertRedirect(route('login'));
});

it('solicitante no puede actualizar auxiliar', function () {
    $this->actingAs($this->solicitante)
        ->put(route('admin.auxiliares.update', $this->auxiliar), [
            'disponible' => false,
        ])->assertForbidden();
});

it('auxiliar no puede actualizar auxiliar', function () {
    $this->actingAs($this->auxiliar)
        ->put(route('admin.auxiliares.update', $this->auxiliar), [
            'disponible' => false,
        ])->assertForbidden();
});

// ── Actualizar campos básicos ──────────────────────────────

it('admin puede actualizar whatsapp de auxiliar', function () {
    $this->actingAs($this->admin)
        ->put(route('admin.auxiliares.update', $this->auxiliar), [
            'whatsapp_telefono' => '+52 1234567890',
        ])->assertRedirect()
        ->assertSessionHas('exito');

    expect($this->auxiliar->fresh()->whatsapp_telefono)->toBe('+52 1234567890');
});

it('admin puede cambiar disponibilidad de auxiliar', function () {
    $this->actingAs($this->admin)
        ->put(route('admin.auxiliares.update', $this->auxiliar), [
            'disponible' => false,
        ])->assertRedirect();

    expect($this->auxiliar->fresh()->disponible)->toBeFalse();
});

// ── Especialidades (texto libre) ───────────────────────────

it('admin puede actualizar especialidades de auxiliar', function () {
    $this->actingAs($this->admin)
        ->put(route('admin.auxiliares.update', $this->auxiliar), [
            'especialidades' => 'redes, impresoras, servidores',
        ])->assertRedirect();

    expect($this->auxiliar->fresh()->especialidades)->toBe('redes, impresoras, servidores');
});

it('admin puede limpiar especialidades de auxiliar', function () {
    $this->auxiliar->update(['especialidades' => 'redes, impresoras']);

    $this->actingAs($this->admin)
        ->put(route('admin.auxiliares.update', $this->auxiliar), [
            'especialidades' => null,
        ])->assertRedirect();

    expect($this->auxiliar->fresh()->especialidades)->toBeNull();
});

it('validacion rechaza especialidades demasiado largas', function () {
    $this->actingAs($this->admin)
        ->put(route('admin.auxiliares.update', $this->auxiliar), [
            'especialidades' => str_repeat('a', 501),
        ])->assertSessionHasErrors('especialidades');
});

// ── Validaciones básicas ───────────────────────────────────

it('validacion rechaza whatsapp demasiado largo', function () {
    $this->actingAs($this->admin)
        ->put(route('admin.auxiliares.update', $this->auxiliar), [
            'whatsapp_telefono' => str_repeat('1', 21),
        ])->assertSessionHasErrors('whatsapp_telefono');
});

// ── Horarios ───────────────────────────────────────────────

it('admin puede actualizar horarios de auxiliar', function () {
    HorarioAuxiliar::factory()->create(['user_id' => $this->auxiliar->id, 'dia' => 'Lunes']);

    $this->actingAs($this->admin)
        ->put(route('admin.auxiliares.update', $this->auxiliar), [
            'horarios' => [
                ['dia' => 'Martes', 'hora_inicio' => '09:00', 'hora_fin' => '17:00'],
                ['dia' => 'Miercoles', 'hora_inicio' => '10:00', 'hora_fin' => '15:00'],
            ],
        ])->assertRedirect();

    $horarios = $this->auxiliar->fresh()->horariosDisponibilidad;
    expect($horarios)->toHaveCount(2);
    expect($horarios->pluck('dia.value')->toArray())->toBe(['Martes', 'Miercoles']);
});

it('admin puede limpiar horarios de auxiliar', function () {
    HorarioAuxiliar::factory()->count(3)->create(['user_id' => $this->auxiliar->id]);

    $this->actingAs($this->admin)
        ->put(route('admin.auxiliares.update', $this->auxiliar), [
            'horarios' => [],
        ])->assertRedirect();

    expect($this->auxiliar->fresh()->horariosDisponibilidad)->toHaveCount(0);
});

it('admin puede crear multiples horarios por dia', function () {
    $this->actingAs($this->admin)
        ->put(route('admin.auxiliares.update', $this->auxiliar), [
            'horarios' => [
                ['dia' => 'Lunes', 'hora_inicio' => '08:00', 'hora_fin' => '12:00'],
                ['dia' => 'Lunes', 'hora_inicio' => '14:00', 'hora_fin' => '18:00'],
            ],
        ])->assertRedirect();

    expect($this->auxiliar->fresh()->horariosDisponibilidad)->toHaveCount(2);
});

it('validacion rechaza dia invalido en horario', function () {
    $this->actingAs($this->admin)
        ->put(route('admin.auxiliares.update', $this->auxiliar), [
            'horarios' => [
                ['dia' => 'DiaInventado', 'hora_inicio' => '08:00', 'hora_fin' => '12:00'],
            ],
        ])->assertSessionHasErrors('horarios.0.dia');
});

it('validacion rechaza hora_fin menor que hora_inicio', function () {
    $this->actingAs($this->admin)
        ->put(route('admin.auxiliares.update', $this->auxiliar), [
            'horarios' => [
                ['dia' => 'Lunes', 'hora_inicio' => '18:00', 'hora_fin' => '08:00'],
            ],
        ])->assertSessionHasErrors('horarios.0.hora_fin');
});
