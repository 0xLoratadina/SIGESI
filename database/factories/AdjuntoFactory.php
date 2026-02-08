<?php

namespace Database\Factories;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Adjunto>
 */
class AdjuntoFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $extension = fake()->randomElement(['pdf', 'jpg', 'png', 'docx']);

        return [
            'ticket_id' => Ticket::factory(),
            'comentario_id' => null,
            'usuario_id' => User::factory(),
            'nombre' => fake()->word().'.'.$extension,
            'ruta' => 'adjuntos/'.fake()->uuid().'.'.$extension,
            'tamano' => fake()->numberBetween(1024, 5242880),
            'tipo_mime' => match ($extension) {
                'pdf' => 'application/pdf',
                'jpg' => 'image/jpeg',
                'png' => 'image/png',
                'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            },
        ];
    }
}
