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
            ->has('tickets')
            ->has('estadoConexion')
        );
});

it('mensajes se cargan como deferred prop', function () {
    $admin = User::factory()->administrador()->create();

    $response = $this->actingAs($admin)
        ->get(route('admin.whatsapp'));

    $response->assertSuccessful();

    // mensajes es un deferred prop, no está en la respuesta inicial
    $page = $response->viewData('page');
    expect($page['deferredProps'])->toHaveKey('default');
});

it('usuario no autenticado es redirigido al login', function () {
    $this->get(route('admin.whatsapp'))
        ->assertRedirect(route('login'));
});
