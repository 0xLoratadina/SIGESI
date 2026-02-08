<?php

namespace Database\Factories;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Comentario>
 */
class ComentarioFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'ticket_id' => Ticket::factory(),
            'usuario_id' => User::factory(),
            'cuerpo' => fake()->paragraph(),
            'es_interno' => false,
        ];
    }

    public function interno(): static
    {
        return $this->state(fn (array $atributos) => [
            'es_interno' => true,
        ]);
    }
}
