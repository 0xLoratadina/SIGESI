<?php

namespace Database\Factories;

use App\Enums\EstadoTicket;
use App\Models\Area;
use App\Models\Categoria;
use App\Models\Prioridad;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Ticket>
 */
class TicketFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'titulo' => fake()->sentence(6),
            'descripcion' => fake()->paragraph(3),
            'solicitante_id' => User::factory()->solicitante(),
            'creador_id' => fn (array $atributos) => $atributos['solicitante_id'],
            'area_id' => Area::factory(),
            'categoria_id' => Categoria::factory(),
            'prioridad_id' => Prioridad::factory(),
            'ubicacion_id' => null,
            'estado' => EstadoTicket::Abierto,
            'auxiliar_id' => null,
            'asignado_por' => null,
            'fecha_asignacion' => null,
            'fecha_resolucion' => null,
            'fecha_cierre' => null,
            'solucion' => null,
            'calificacion' => null,
            'comentario_cal' => null,
            'fecha_limite' => fn () => now()->addHours(24),
        ];
    }

    public function asignado(): static
    {
        return $this->state(fn (array $atributos) => [
            'estado' => EstadoTicket::Asignado,
            'auxiliar_id' => User::factory()->auxiliar(),
            'asignado_por' => User::factory()->administrador(),
            'fecha_asignacion' => now(),
        ]);
    }

    public function enProgreso(): static
    {
        return $this->asignado()->state(fn (array $atributos) => [
            'estado' => EstadoTicket::EnProgreso,
        ]);
    }

    public function enEspera(): static
    {
        return $this->asignado()->state(fn (array $atributos) => [
            'estado' => EstadoTicket::EnEspera,
        ]);
    }

    public function resuelto(): static
    {
        return $this->enProgreso()->state(fn (array $atributos) => [
            'estado' => EstadoTicket::Resuelto,
            'fecha_resolucion' => now(),
            'solucion' => fake()->paragraph(),
        ]);
    }

    public function cerrado(): static
    {
        return $this->resuelto()->state(fn (array $atributos) => [
            'estado' => EstadoTicket::Cerrado,
            'fecha_cierre' => now(),
            'calificacion' => fake()->numberBetween(1, 5),
            'comentario_cal' => fake()->sentence(),
        ]);
    }

    public function cancelado(): static
    {
        return $this->state(fn (array $atributos) => [
            'estado' => EstadoTicket::Cancelado,
        ]);
    }
}
