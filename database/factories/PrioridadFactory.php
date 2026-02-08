<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Prioridad>
 */
class PrioridadFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nombre' => fake()->unique()->word(),
            'color' => fake()->hexColor(),
            'horas_respuesta' => fake()->numberBetween(1, 24),
            'horas_resolucion' => fake()->numberBetween(4, 72),
            'nivel' => fake()->unique()->numberBetween(1, 100),
            'activo' => true,
        ];
    }
}
