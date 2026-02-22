<?php

use App\Enums\Dia;
use App\Models\HorarioAuxiliar;
use App\Models\User;

it('pertenece a un usuario', function () {
    $horario = HorarioAuxiliar::factory()->create();

    expect($horario->user)->toBeInstanceOf(User::class);
});

it('castea dia como enum Dia', function () {
    $horario = HorarioAuxiliar::factory()->create(['dia' => 'Lunes']);

    expect($horario->dia)->toBe(Dia::Lunes);
});

it('permite multiples horarios por dia para un usuario', function () {
    $usuario = User::factory()->auxiliar()->create();

    HorarioAuxiliar::factory()->create([
        'user_id' => $usuario->id,
        'dia' => Dia::Lunes,
        'hora_inicio' => '08:00',
        'hora_fin' => '12:00',
    ]);

    HorarioAuxiliar::factory()->create([
        'user_id' => $usuario->id,
        'dia' => Dia::Lunes,
        'hora_inicio' => '14:00',
        'hora_fin' => '18:00',
    ]);

    expect($usuario->horariosDisponibilidad)->toHaveCount(2);
});

it('se elimina en cascada al borrar usuario', function () {
    $usuario = User::factory()->auxiliar()->create();
    HorarioAuxiliar::factory()->count(3)->create(['user_id' => $usuario->id]);

    expect(HorarioAuxiliar::where('user_id', $usuario->id)->count())->toBe(3);

    $usuario->delete();

    expect(HorarioAuxiliar::where('user_id', $usuario->id)->count())->toBe(0);
});
