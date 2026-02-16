<?php

namespace Database\Factories;

use App\Enums\Rol;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
            'rol' => Rol::Solicitante,
            'departamento_id' => null,
            'telefono' => fake()->numerify('##########'),
            'num_empleado' => fake()->unique()->numerify('EMP####'),
            'cargo' => fake()->jobTitle(),
            'activo' => true,
            'disponible' => true,
            'max_tickets' => 10,
            'onboarding_completado' => true,
            'debe_cambiar_password' => false,
            'fecha_onboarding' => now(),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function withTwoFactor(): static
    {
        return $this->state(fn (array $attributes) => [
            'two_factor_secret' => encrypt('secret'),
            'two_factor_recovery_codes' => encrypt(json_encode(['recovery-code-1'])),
            'two_factor_confirmed_at' => now(),
        ]);
    }

    public function administrador(): static
    {
        return $this->state(fn (array $attributes) => [
            'rol' => Rol::Administrador,
        ]);
    }

    public function tecnico(): static
    {
        return $this->state(fn (array $attributes) => [
            'rol' => Rol::Tecnico,
            'disponible' => true,
            'max_tickets' => fake()->numberBetween(5, 15),
        ]);
    }

    public function solicitante(): static
    {
        return $this->state(fn (array $attributes) => [
            'rol' => Rol::Solicitante,
        ]);
    }

    public function inactivo(): static
    {
        return $this->state(fn (array $attributes) => [
            'activo' => false,
        ]);
    }

    public function sinOnboarding(): static
    {
        return $this->state(fn (array $attributes) => [
            'onboarding_completado' => false,
            'debe_cambiar_password' => true,
            'fecha_onboarding' => null,
        ]);
    }
}
