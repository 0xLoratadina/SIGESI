<?php

test('home redirige a login si no esta autenticado', function () {
    $response = $this->get(route('home'));

    $response->assertRedirect(route('login'));
});

test('home redirige a dashboard si esta autenticado', function () {
    $usuario = \App\Models\User::factory()->create();

    $response = $this->actingAs($usuario)->get(route('home'));

    $response->assertRedirect(route('dashboard'));
});