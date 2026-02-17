<?php

use App\Models\User;

it('admin puede ver la pagina de whatsapp inbox', function () {
    $admin = User::factory()->administrador()->create();

    $this->actingAs($admin)
        ->get(route('admin.whatsapp'))
        ->assertSuccessful()
        ->assertInertia(fn ($pagina) => $pagina->component('admin/whatsapp/index'));
});

it('solicitante recibe 403', function () {
    $solicitante = User::factory()->solicitante()->create();

    $this->actingAs($solicitante)
        ->get(route('admin.whatsapp'))
        ->assertForbidden();
});

it('tecnico recibe 403', function () {
    $tecnico = User::factory()->tecnico()->create();

    $this->actingAs($tecnico)
        ->get(route('admin.whatsapp'))
        ->assertForbidden();
});

it('pagina incluye todos los datos necesarios', function () {
    $admin = User::factory()->administrador()->create();

    $this->actingAs($admin)
        ->get(route('admin.whatsapp'))
        ->assertInertia(fn ($pagina) => $pagina
            ->component('admin/whatsapp/index')
            ->has('chats')
            ->has('mensajes')
            ->has('tickets')
            ->has('estadoConexion')
        );
});

it('usuario no autenticado es redirigido al login', function () {
    $this->get(route('admin.whatsapp'))
        ->assertRedirect(route('login'));
});
