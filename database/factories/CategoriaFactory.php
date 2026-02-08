<?php

namespace Database\Factories;

use App\Models\Categoria;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Categoria>
 */
class CategoriaFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nombre' => fake()->unique()->word(),
            'descripcion' => fake()->optional()->sentence(),
            'padre_id' => null,
            'icono' => null,
            'activo' => true,
        ];
    }

    public function subcategoria(): static
    {
        return $this->state(fn (array $attributes) => [
            'padre_id' => Categoria::factory(),
        ]);
    }
}
