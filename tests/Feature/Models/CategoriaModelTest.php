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

it('tiene auxiliares via pivot', function () {
    $categoria = Categoria::factory()->create();
    $auxiliares = User::factory()->auxiliar()->count(2)->create();

    $categoria->auxiliares()->attach($auxiliares->pluck('id'));

    expect($categoria->auxiliares)->toHaveCount(2);
});
