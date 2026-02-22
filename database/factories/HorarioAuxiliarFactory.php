<?php

namespace Database\Factories;

use App\Enums\Dia;
use App\Models\HorarioAuxiliar;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\HorarioAuxiliar>
 */
class HorarioAuxiliarFactory extends Factory
{
    protected $model = HorarioAuxiliar::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->auxiliar(),
            'dia' => fake()->randomElement(Dia::cases()),
            'hora_inicio' => '08:00',
            'hora_fin' => '16:00',
        ];
    }
}
