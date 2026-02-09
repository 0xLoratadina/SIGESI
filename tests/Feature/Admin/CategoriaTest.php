<?php

use App\Models\Categoria;
use App\Models\Ticket;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->administrador()->create();
    $this->solicitante = User::factory()->solicitante()->create();
});

it('solo admin puede crear categoria', function () {
    $this->actingAs($this->solicitante)
        ->post(route('admin.categorias.store'), [
            'nombre' => 'Hardware',
        ])->assertForbidden();
});

it('admin puede crear categoria padre', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.categorias.store'), [
            'nombre' => 'Hardware',
            'descripcion' => 'Problemas de hardware',
        ])->assertRedirect();

    $this->assertDatabaseHas('categorias', [
        'nombre' => 'Hardware',
        'padre_id' => null,
        'activo' => true,
    ]);
});

it('admin puede crear subcategoria', function () {
    $padre = Categoria::factory()->create(['nombre' => 'Hardware']);

    $this->actingAs($this->admin)
        ->post(route('admin.categorias.store'), [
            'nombre' => 'Impresora',
            'padre_id' => $padre->id,
        ])->assertRedirect();

    $this->assertDatabaseHas('categorias', [
        'nombre' => 'Impresora',
        'padre_id' => $padre->id,
    ]);
});

it('validacion rechaza nombre vacio', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.categorias.store'), [
            'nombre' => '',
        ])->assertSessionHasErrors('nombre');
});

it('validacion rechaza padre_id inexistente', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.categorias.store'), [
            'nombre' => 'Test',
            'padre_id' => 9999,
        ])->assertSessionHasErrors('padre_id');
});

it('admin puede actualizar categoria', function () {
    $cat = Categoria::factory()->create(['nombre' => 'Original']);

    $this->actingAs($this->admin)
        ->put(route('admin.categorias.update', $cat), [
            'nombre' => 'Actualizada',
        ])->assertRedirect();

    expect($cat->fresh()->nombre)->toBe('Actualizada');
});

it('admin puede desactivar categoria', function () {
    $cat = Categoria::factory()->create(['activo' => true]);

    $this->actingAs($this->admin)
        ->put(route('admin.categorias.update', $cat), [
            'nombre' => $cat->nombre,
            'activo' => false,
        ])->assertRedirect();

    expect($cat->fresh()->activo)->toBeFalse();
});

it('admin puede eliminar categoria sin dependencias', function () {
    $cat = Categoria::factory()->create();

    $this->actingAs($this->admin)
        ->delete(route('admin.categorias.destroy', $cat))
        ->assertRedirect();

    $this->assertDatabaseMissing('categorias', ['id' => $cat->id]);
});

it('no se puede eliminar categoria con tickets', function () {
    $cat = Categoria::factory()->create();
    Ticket::factory()->create(['categoria_id' => $cat->id]);

    $this->actingAs($this->admin)
        ->delete(route('admin.categorias.destroy', $cat))
        ->assertSessionHasErrors('general');
});

it('no se puede eliminar categoria con subcategorias', function () {
    $padre = Categoria::factory()->create();
    Categoria::factory()->create(['padre_id' => $padre->id]);

    $this->actingAs($this->admin)
        ->delete(route('admin.categorias.destroy', $padre))
        ->assertSessionHasErrors('general');
});
