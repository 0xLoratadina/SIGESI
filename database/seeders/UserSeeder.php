<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Administrador
        User::factory()->administrador()->create([
            'name' => 'Administrador del Sistema',
            'email' => 'admin@sigesi.com',
            'num_empleado' => 'ADM001',
            'cargo' => 'Administrador de Soporte',
        ]);

        // Tecnicos
        User::factory()->tecnico()->create([
            'name' => 'Carlos Martinez Lopez',
            'email' => 'carlos.martinez@sigesi.com',
            'num_empleado' => 'TEC001',
            'cargo' => 'Tecnico en Soporte',
        ]);

        User::factory()->tecnico()->create([
            'name' => 'Ana Garcia Ruiz',
            'email' => 'ana.garcia@sigesi.com',
            'num_empleado' => 'TEC002',
            'cargo' => 'Tecnico en Redes',
        ]);

        // Solicitantes
        User::factory()->solicitante()->create([
            'name' => 'Maria Lopez Hernandez',
            'email' => 'maria.lopez@sigesi.com',
            'num_empleado' => 'EMP001',
            'cargo' => 'Coordinadora',
        ]);

        User::factory()->solicitante()->create([
            'name' => 'Roberto Sanchez Perez',
            'email' => 'roberto.sanchez@sigesi.com',
            'num_empleado' => 'EMP002',
            'cargo' => 'Analista',
        ]);

        User::factory()->solicitante()->create([
            'name' => 'Laura Torres Diaz',
            'email' => 'laura.torres@sigesi.com',
            'num_empleado' => 'EMP003',
            'cargo' => 'Ejecutiva',
        ]);
    }
}
