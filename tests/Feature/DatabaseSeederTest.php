<?php

use App\Models\Categoria;
use App\Models\Configuracion;
use App\Models\Departamento;
use App\Models\Prioridad;
use App\Models\Ticket;
use App\Models\User;

it('crea 17 departamentos', function () {
    $this->seed();

    expect(Departamento::count())->toBe(17);
});

it('crea 4 prioridades con SLA', function () {
    $this->seed();

    expect(Prioridad::count())->toBe(4);
    expect(Prioridad::where('nombre', 'Critica')->first()->horas_resolucion)->toBe(4);
});

it('crea categorias padres e hijas', function () {
    $this->seed();

    $padres = Categoria::whereNull('padre_id')->count();
    $hijas = Categoria::whereNotNull('padre_id')->count();

    expect($padres)->toBe(7)
        ->and($hijas)->toBeGreaterThanOrEqual(12);
});

it('crea usuario admin con correo correcto', function () {
    $this->seed();

    $admin = User::where('email', 'admin@sigesi.com')->first();

    expect($admin)->not->toBeNull()
        ->and($admin->esAdmin())->toBeTrue();
});

it('crea tickets en estados variados', function () {
    $this->seed();

    expect(Ticket::count())->toBeGreaterThanOrEqual(15);
    expect(Ticket::where('estado', 'Abierto')->count())->toBeGreaterThanOrEqual(1);
    expect(Ticket::where('estado', 'Resuelto')->count())->toBeGreaterThanOrEqual(1);
});

it('crea configuraciones iniciales', function () {
    $this->seed();

    expect(Configuracion::count())->toBe(5);
    expect(Configuracion::where('clave', 'prefijo_ticket')->first()->valor)->toBe('INC');
});
