<?php

use App\Models\Area;
use App\Models\Ubicacion;
use App\Models\User;

test('solicitante sin onboarding es redirigido a pagina de onboarding', function () {
    $usuario = User::factory()->solicitante()->sinOnboarding()->create();

    $this->actingAs($usuario)
        ->get(route('dashboard'))
        ->assertRedirect(route('onboarding.index'));
});

test('auxiliar sin onboarding no es redirigido a onboarding', function () {
    $usuario = User::factory()->auxiliar()->sinOnboarding()->create();

    $this->actingAs($usuario)
        ->get(route('dashboard'))
        ->assertSuccessful();
});

test('admin sin onboarding no es redirigido a onboarding', function () {
    $usuario = User::factory()->administrador()->sinOnboarding()->create();

    $this->actingAs($usuario)
        ->get(route('dashboard'))
        ->assertSuccessful();
});

test('solicitante con onboarding completado accede al dashboard', function () {
    $usuario = User::factory()->solicitante()->create();

    $this->actingAs($usuario)
        ->get(route('dashboard'))
        ->assertSuccessful();
});

test('pagina de onboarding se renderiza correctamente', function () {
    $usuario = User::factory()->solicitante()->sinOnboarding()->create();

    $this->actingAs($usuario)
        ->get(route('onboarding.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($pagina) => $pagina
            ->component('onboarding/index')
            ->has('areas')
            ->has('ubicaciones')
            ->has('debeCambiarPassword')
        );
});

test('solicitante con onboarding completado es redirigido al dashboard al visitar onboarding', function () {
    $usuario = User::factory()->solicitante()->create();

    $this->actingAs($usuario)
        ->get(route('onboarding.index'))
        ->assertRedirect(route('dashboard'));
});

test('solicitante puede cambiar contrasena temporal', function () {
    $usuario = User::factory()->solicitante()->sinOnboarding()->create();

    $this->actingAs($usuario)
        ->put(route('onboarding.cambiar-password'), [
            'password' => 'nuevapassword123',
            'password_confirmation' => 'nuevapassword123',
        ])
        ->assertRedirect();

    $usuario->refresh();
    expect($usuario->debe_cambiar_password)->toBeFalse();
});

test('cambio de contrasena rechaza contrasenas que no coinciden', function () {
    $usuario = User::factory()->solicitante()->sinOnboarding()->create();

    $this->actingAs($usuario)
        ->put(route('onboarding.cambiar-password'), [
            'password' => 'nuevapassword123',
            'password_confirmation' => 'otrapassword456',
        ])
        ->assertSessionHasErrors('password');
});

test('cambio de contrasena requiere minimo 8 caracteres', function () {
    $usuario = User::factory()->solicitante()->sinOnboarding()->create();

    $this->actingAs($usuario)
        ->put(route('onboarding.cambiar-password'), [
            'password' => 'corta',
            'password_confirmation' => 'corta',
        ])
        ->assertSessionHasErrors('password');
});

test('solicitante puede completar onboarding con datos validos', function () {
    $usuario = User::factory()->solicitante()->sinOnboarding()->create([
        'name' => 'Usuario Temporal',
        'telefono' => null,
        'cargo' => null,
        'area_id' => null,
    ]);
    $area = Area::factory()->create();
    $ubicacion = Ubicacion::factory()->create(['area_id' => $area->id]);

    $this->actingAs($usuario)
        ->post(route('onboarding.completar'), [
            'name' => 'María López García',
            'telefono' => '5551234567',
            'cargo' => 'Analista de Sistemas',
            'area_id' => $area->id,
            'ubicacion_id' => $ubicacion->id,
        ])
        ->assertRedirect(route('dashboard'));

    $usuario->refresh();
    expect($usuario)
        ->onboarding_completado->toBeTrue()
        ->fecha_onboarding->not->toBeNull()
        ->name->toBe('María López García')
        ->telefono->toBe('5551234567')
        ->cargo->toBe('Analista de Sistemas')
        ->area_id->toBe($area->id)
        ->ubicacion_id->toBe($ubicacion->id);
});

test('solicitante puede completar onboarding sin ubicacion', function () {
    $usuario = User::factory()->solicitante()->sinOnboarding()->create([
        'telefono' => null,
        'cargo' => null,
        'area_id' => null,
    ]);
    $area = Area::factory()->create();

    $this->actingAs($usuario)
        ->post(route('onboarding.completar'), [
            'name' => 'Pedro Coordinador',
            'telefono' => '5551234567',
            'cargo' => 'Coordinador',
            'area_id' => $area->id,
        ])
        ->assertRedirect(route('dashboard'));

    $usuario->refresh();
    expect($usuario)
        ->onboarding_completado->toBeTrue()
        ->ubicacion_id->toBeNull();
});

test('onboarding rechaza datos incompletos', function () {
    $usuario = User::factory()->solicitante()->sinOnboarding()->create();

    $this->actingAs($usuario)
        ->post(route('onboarding.completar'), [])
        ->assertSessionHasErrors(['name', 'telefono', 'cargo', 'area_id']);
});

test('onboarding no requiere verificacion de email', function () {
    $usuario = User::factory()->solicitante()->sinOnboarding()->unverified()->create();

    $this->actingAs($usuario)
        ->get(route('onboarding.index'))
        ->assertSuccessful();
});

test('solicitante sin onboarding no puede acceder a settings', function () {
    $usuario = User::factory()->solicitante()->sinOnboarding()->create();

    $this->actingAs($usuario)
        ->get(route('profile.edit'))
        ->assertRedirect(route('onboarding.index'));
});
