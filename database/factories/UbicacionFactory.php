<?php

namespace Database\Factories;

use App\Models\Area;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Ubicacion>
 */
class UbicacionFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nombre' => fake()->unique()->words(3, true),
            'edificio' => fake()->word(),
            'piso' => fake()->optional()->randomElement(['Planta Baja', 'Piso 1', 'Piso 2']),
            'salon' => fake()->optional()->numerify('Salon ###'),
            'descripcion' => fake()->optional()->sentence(),
            'area_id' => Area::factory(),
            'activo' => true,
        ];
    }
}
