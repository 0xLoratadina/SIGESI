<?php

use App\Enums\Rol;
use App\Models\User;

test('solo admin puede acceder a gestion de usuarios', function () {
    $admin = User::factory()->administrador()->create();

    $this->actingAs($admin)
        ->get(route('admin.usuarios'))
        ->assertSuccessful();
});

test('solicitante no puede acceder a gestion de usuarios', function () {
    $solicitante = User::factory()->solicitante()->create();

    $this->actingAs($solicitante)
        ->get(route('admin.usuarios'))
        ->assertForbidden();
});

test('tecnico no puede acceder a gestion de usuarios', function () {
    $tecnico = User::factory()->tecnico()->create();

    $this->actingAs($tecnico)
        ->get(route('admin.usuarios'))
        ->assertForbidden();
});

test('admin puede crear usuario con contrasena autogenerada', function () {
    $admin = User::factory()->administrador()->create();

    $this->actingAs($admin)
        ->post(route('admin.usuarios.store'), [
            'name' => 'Juan Perez',
            'email' => 'juan.perez@sigesi.com',
            'rol' => Rol::Solicitante->value,
        ])
        ->assertRedirect()
        ->assertSessionHas('credenciales');

    $usuario = User::where('email', 'juan.perez@sigesi.com')->first();
    expect($usuario)
        ->not->toBeNull()
        ->name->toBe('Juan Perez')
        ->password->not->toBeNull()
        ->debe_cambiar_password->toBeTrue()
        ->onboarding_completado->toBeFalse()
        ->email_verified_at->not->toBeNull();
});

test('credenciales generadas incluyen datos del usuario', function () {
    $admin = User::factory()->administrador()->create();

    $response = $this->actingAs($admin)
        ->post(route('admin.usuarios.store'), [
            'name' => 'Maria Garcia',
            'email' => 'maria.garcia@sigesi.com',
            'rol' => Rol::Solicitante->value,
        ]);

    $credenciales = session('credenciales');
    expect($credenciales)
        ->nombre->toBe('Maria Garcia')
        ->email->toBe('maria.garcia@sigesi.com')
        ->password->toBeString()
        ->password->toHaveLength(12)
        ->rol->toBe('Solicitante');
});

test('usuario creado por admin tiene email verificado automaticamente', function () {
    $admin = User::factory()->administrador()->create();

    $this->actingAs($admin)
        ->post(route('admin.usuarios.store'), [
            'name' => 'Test User',
            'email' => 'test@sigesi.com',
            'rol' => Rol::Tecnico->value,
        ]);

    expect(User::where('email', 'test@sigesi.com')->first())
        ->email_verified_at->not->toBeNull();
});

test('tecnico creado por admin no requiere onboarding', function () {
    $admin = User::factory()->administrador()->create();

    $this->actingAs($admin)
        ->post(route('admin.usuarios.store'), [
            'name' => 'Tecnico Nuevo',
            'email' => 'tecnico@sigesi.com',
            'rol' => Rol::Tecnico->value,
        ]);

    $usuario = User::where('email', 'tecnico@sigesi.com')->first();
    expect($usuario)
        ->onboarding_completado->toBeTrue()
        ->debe_cambiar_password->toBeFalse();
});

test('solicitante creado por admin requiere onboarding', function () {
    $admin = User::factory()->administrador()->create();

    $this->actingAs($admin)
        ->post(route('admin.usuarios.store'), [
            'name' => 'Solicitante Nuevo',
            'email' => 'solicitante@sigesi.com',
            'rol' => Rol::Solicitante->value,
        ]);

    $usuario = User::where('email', 'solicitante@sigesi.com')->first();
    expect($usuario)
        ->onboarding_completado->toBeFalse()
        ->debe_cambiar_password->toBeTrue();
});

test('validacion rechaza email duplicado', function () {
    $admin = User::factory()->administrador()->create();
    User::factory()->create(['email' => 'existente@sigesi.com']);

    $this->actingAs($admin)
        ->post(route('admin.usuarios.store'), [
            'name' => 'Otro Usuario',
            'email' => 'existente@sigesi.com',
            'rol' => Rol::Solicitante->value,
        ])
        ->assertSessionHasErrors('email');
});

test('admin puede actualizar datos de usuario', function () {
    $admin = User::factory()->administrador()->create();
    $usuario = User::factory()->solicitante()->create();

    $this->actingAs($admin)
        ->put(route('admin.usuarios.update', $usuario), [
            'name' => 'Nombre Actualizado',
            'email' => $usuario->email,
            'rol' => Rol::Tecnico->value,
        ])
        ->assertRedirect();

    $usuario->refresh();
    expect($usuario)
        ->name->toBe('Nombre Actualizado')
        ->rol->toBe(Rol::Tecnico);
});

test('admin puede resetear contrasena de usuario', function () {
    $admin = User::factory()->administrador()->create();
    $usuario = User::factory()->create();
    $passwordAnterior = $usuario->password;

    $this->actingAs($admin)
        ->put(route('admin.usuarios.update', $usuario), [
            'name' => $usuario->name,
            'email' => $usuario->email,
            'rol' => $usuario->rol->value,
            'password_temporal' => 'nuevapassword123',
        ])
        ->assertRedirect();

    $usuario->refresh();
    expect($usuario)
        ->password->not->toBe($passwordAnterior)
        ->debe_cambiar_password->toBeTrue();
});

test('admin puede desactivar usuario con tickets', function () {
    $admin = User::factory()->administrador()->create();
    $usuario = User::factory()->solicitante()->create();

    \App\Models\Ticket::factory()->create(['solicitante_id' => $usuario->id, 'creador_id' => $usuario->id]);

    $this->actingAs($admin)
        ->delete(route('admin.usuarios.destroy', $usuario))
        ->assertRedirect();

    $usuario->refresh();
    expect($usuario->activo)->toBeFalse();
    expect(User::find($usuario->id))->not->toBeNull();
});

test('admin puede eliminar usuario sin tickets', function () {
    $admin = User::factory()->administrador()->create();
    $usuario = User::factory()->solicitante()->create();

    $this->actingAs($admin)
        ->delete(route('admin.usuarios.destroy', $usuario))
        ->assertRedirect();

    expect(User::find($usuario->id))->toBeNull();
});

test('admin no puede eliminar cuenta de otro admin', function () {
    $admin = User::factory()->administrador()->create();
    $otroAdmin = User::factory()->administrador()->create();

    $this->actingAs($admin)
        ->delete(route('admin.usuarios.destroy', $otroAdmin))
        ->assertForbidden();

    expect(User::find($otroAdmin->id))->not->toBeNull();
});

test('pagina de usuarios muestra listado paginado', function () {
    $admin = User::factory()->administrador()->create();
    User::factory()->count(3)->create();

    $this->actingAs($admin)
        ->get(route('admin.usuarios'))
        ->assertInertia(fn ($pagina) => $pagina
            ->component('admin/usuarios')
            ->has('usuarios.data', 4) // 3 + admin
            ->has('departamentos')
        );
});
