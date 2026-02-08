<?php

namespace Database\Seeders;

use App\Models\Prioridad;
use Illuminate\Database\Seeder;

class PrioridadSeeder extends Seeder
{
    public function run(): void
    {
        $prioridades = [
            ['nombre' => 'Critica', 'color' => '#DC2626', 'horas_respuesta' => 1, 'horas_resolucion' => 4, 'nivel' => 1],
            ['nombre' => 'Alta', 'color' => '#EA580C', 'horas_respuesta' => 2, 'horas_resolucion' => 8, 'nivel' => 2],
            ['nombre' => 'Media', 'color' => '#CA8A04', 'horas_respuesta' => 4, 'horas_resolucion' => 24, 'nivel' => 3],
            ['nombre' => 'Baja', 'color' => '#16A34A', 'horas_respuesta' => 8, 'horas_resolucion' => 72, 'nivel' => 4],
        ];

        foreach ($prioridades as $prioridad) {
            Prioridad::create($prioridad);
        }
    }
}
