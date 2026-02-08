<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Departamento>
 */
class DepartamentoFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nombre' => fake()->unique()->company(),
            'codigo' => fake()->unique()->lexify('????'),
            'edificio' => fake()->optional()->word(),
            'telefono' => fake()->optional()->numerify('Ext. ###'),
            'jefe' => fake()->optional()->name(),
            'activo' => true,
        ];
    }
}
