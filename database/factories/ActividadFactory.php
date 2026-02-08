<?php

namespace Database\Factories;

use App\Enums\TipoActividad;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Actividad>
 */
class ActividadFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'ticket_id' => Ticket::factory(),
            'usuario_id' => User::factory(),
            'tipo' => TipoActividad::CambioEstado,
            'descripcion' => fake()->sentence(),
            'valor_anterior' => null,
            'valor_nuevo' => null,
        ];
    }
}
