<?php

use App\Models\Categoria;
use App\Models\User;

it('tiene padre y subcategorias', function () {
    $padre = Categoria::factory()->create();
    $hija1 = Categoria::factory()->create(['padre_id' => $padre->id]);
    $hija2 = Categoria::factory()->create(['padre_id' => $padre->id]);

    expect($padre->hijas)->toHaveCount(2)
        ->and($hija1->padre->id)->toBe($padre->id);
});

it('tiene tecnicos via pivot', function () {
    $categoria = Categoria::factory()->create();
    $tecnicos = User::factory()->tecnico()->count(2)->create();

    $categoria->tecnicos()->attach($tecnicos->pluck('id'));

    expect($categoria->tecnicos)->toHaveCount(2);
});
