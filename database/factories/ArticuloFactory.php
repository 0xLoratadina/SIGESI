<?php

namespace Database\Factories;

use App\Enums\EstadoArticulo;
use App\Models\Categoria;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Articulo>
 */
class ArticuloFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $titulo = fake()->sentence(4);

        return [
            'titulo' => $titulo,
            'slug' => Str::slug($titulo),
            'contenido' => fake()->paragraphs(3, true),
            'categoria_id' => Categoria::factory(),
            'autor_id' => User::factory()->tecnico(),
            'estado' => EstadoArticulo::Borrador,
            'vistas' => 0,
            'fecha_publicacion' => null,
        ];
    }

    public function publicado(): static
    {
        return $this->state(fn (array $atributos) => [
            'estado' => EstadoArticulo::Publicado,
            'fecha_publicacion' => now(),
        ]);
    }
}
