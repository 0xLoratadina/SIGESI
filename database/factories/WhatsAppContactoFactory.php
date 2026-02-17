<?php

namespace Database\Factories;

use App\Enums\EstadoTicketChat;
use App\Models\WhatsAppContacto;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WhatsAppContacto>
 */
class WhatsAppContactoFactory extends Factory
{
    public function definition(): array
    {
        return [
            'whatsapp_id' => $this->faker->unique()->numerify('521##########'),
            'telefono' => $this->faker->numerify('+52 ### ### ####'),
            'nombre' => $this->faker->name(),
            'avatar' => null,
            'en_linea' => $this->faker->boolean(30),
            'ultima_conexion' => $this->faker->dateTimeBetween('-1 day', 'now'),
            'estado_ticket' => $this->faker->randomElement(EstadoTicketChat::cases()),
        ];
    }

    public function enLinea(): static
    {
        return $this->state(fn () => ['en_linea' => true]);
    }

    public function sinTicket(): static
    {
        return $this->state(fn () => ['estado_ticket' => EstadoTicketChat::SinTicket]);
    }

    public function pendiente(): static
    {
        return $this->state(fn () => ['estado_ticket' => EstadoTicketChat::Pendiente]);
    }

    public function enProceso(): static
    {
        return $this->state(fn () => ['estado_ticket' => EstadoTicketChat::EnProceso]);
    }

    public function cerrado(): static
    {
        return $this->state(fn () => ['estado_ticket' => EstadoTicketChat::Cerrado]);
    }
}
