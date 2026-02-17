<?php

namespace Database\Factories;

use App\Enums\TipoMensajeWhatsApp;
use App\Models\WhatsAppContacto;
use App\Models\WhatsAppMensaje;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WhatsAppMensaje>
 */
class WhatsAppMensajeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'whatsapp_id' => $this->faker->unique()->uuid(),
            'contacto_id' => WhatsAppContacto::factory(),
            'tipo' => $this->faker->randomElement(TipoMensajeWhatsApp::cases()),
            'contenido' => $this->faker->sentence(),
            'leido' => $this->faker->boolean(70),
            'es_bot' => false,
            'media_url' => null,
            'media_tipo' => null,
            'enviado_at' => $this->faker->dateTimeBetween('-1 week', 'now'),
        ];
    }

    public function recibido(): static
    {
        return $this->state(fn () => ['tipo' => TipoMensajeWhatsApp::Recibido]);
    }

    public function enviado(): static
    {
        return $this->state(fn () => ['tipo' => TipoMensajeWhatsApp::Enviado]);
    }

    public function deBot(): static
    {
        return $this->state(fn () => [
            'tipo' => TipoMensajeWhatsApp::Enviado,
            'es_bot' => true,
        ]);
    }

    public function noLeido(): static
    {
        return $this->state(fn () => ['leido' => false]);
    }

    public function leido(): static
    {
        return $this->state(fn () => ['leido' => true]);
    }
}
