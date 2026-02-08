<?php

namespace Database\Seeders;

use App\Models\Categoria;
use App\Models\Departamento;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $soporte = Departamento::where('codigo', 'STEC')->first();
        $sistemas = Departamento::where('codigo', 'SIST')->first();
        $adminDepto = Departamento::where('codigo', 'ADMN')->first();
        $ventas = Departamento::where('codigo', 'VENT')->first();

        // Administrador
        User::factory()->administrador()->create([
            'name' => 'Administrador del Sistema',
            'email' => 'admin@sigesi.com',
            'num_empleado' => 'ADM001',
            'cargo' => 'Administrador de Soporte',
            'departamento_id' => $soporte?->id,
        ]);

        // Tecnicos
        $tecnico1 = User::factory()->tecnico()->create([
            'name' => 'Carlos Martinez Lopez',
            'email' => 'carlos.martinez@sigesi.com',
            'num_empleado' => 'TEC001',
            'cargo' => 'Tecnico en Soporte',
            'departamento_id' => $soporte?->id,
        ]);

        $tecnico2 = User::factory()->tecnico()->create([
            'name' => 'Ana Garcia Ruiz',
            'email' => 'ana.garcia@sigesi.com',
            'num_empleado' => 'TEC002',
            'cargo' => 'Tecnico en Redes',
            'departamento_id' => $sistemas?->id,
        ]);

        // Asignar especialidades a tecnicos
        $categoriasRed = Categoria::where('nombre', 'Red e Internet')->first();
        $categoriasHw = Categoria::where('nombre', 'Hardware')->first();
        $categoriasSw = Categoria::where('nombre', 'Software')->first();

        if ($categoriasRed && $categoriasHw && $categoriasSw) {
            $tecnico1->especialidades()->attach([$categoriasHw->id, $categoriasSw->id]);
            $tecnico2->especialidades()->attach([$categoriasRed->id]);
        }

        // Solicitantes
        User::factory()->solicitante()->create([
            'name' => 'Maria Lopez Hernandez',
            'email' => 'maria.lopez@sigesi.com',
            'num_empleado' => 'EMP001',
            'cargo' => 'Coordinadora',
            'departamento_id' => $adminDepto?->id,
        ]);

        User::factory()->solicitante()->create([
            'name' => 'Roberto Sanchez Perez',
            'email' => 'roberto.sanchez@sigesi.com',
            'num_empleado' => 'EMP002',
            'cargo' => 'Analista',
            'departamento_id' => $ventas?->id,
        ]);

        User::factory()->solicitante()->create([
            'name' => 'Laura Torres Diaz',
            'email' => 'laura.torres@sigesi.com',
            'num_empleado' => 'EMP003',
            'cargo' => 'Ejecutiva',
            'departamento_id' => $ventas?->id,
        ]);
    }
}
