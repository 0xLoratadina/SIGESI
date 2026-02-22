<?php

use App\Models\Configuracion;
use App\Models\User;

it('crea usuario admin con correo correcto', function () {
    $this->seed();

    $admin = User::where('email', 'admin@sigesi.com')->first();

    expect($admin)->not->toBeNull()
        ->and($admin->esAdmin())->toBeTrue();
});

it('crea 18 usuarios de prueba', function () {
    $this->seed();

    expect(User::count())->toBe(18);
    expect(User::where('rol', 'Administrador')->count())->toBe(2);
    expect(User::where('rol', 'Auxiliar')->count())->toBe(6);
    expect(User::where('rol', 'Solicitante')->count())->toBe(10);
});

it('crea configuraciones iniciales', function () {
    $this->seed();

    expect(Configuracion::count())->toBe(5);
    expect(Configuracion::where('clave', 'prefijo_ticket')->first()->valor)->toBe('INC');
});
