<?php

namespace Database\Seeders;

use App\Models\Area;
use Illuminate\Database\Seeder;

class AreaSeeder extends Seeder
{
    public function run(): void
    {
        $areas = [
            ['nombre' => 'Soporte Tecnico', 'edificio' => 'Edificio Principal', 'nivel_prioridad' => 1],
            ['nombre' => 'Sistemas', 'edificio' => 'Edificio Principal', 'nivel_prioridad' => 2],
            ['nombre' => 'Redes e Infraestructura', 'edificio' => 'Edificio Principal', 'nivel_prioridad' => 2],
            ['nombre' => 'Desarrollo', 'edificio' => 'Edificio B', 'nivel_prioridad' => 3],
            ['nombre' => 'Administracion', 'edificio' => 'Edificio A', 'nivel_prioridad' => 4],
            ['nombre' => 'Recursos Humanos', 'edificio' => 'Edificio A', 'nivel_prioridad' => 4],
            ['nombre' => 'Finanzas', 'edificio' => 'Edificio A', 'nivel_prioridad' => 3],
            ['nombre' => 'Ventas', 'edificio' => 'Edificio C', 'nivel_prioridad' => 3],
            ['nombre' => 'Marketing', 'edificio' => 'Edificio C', 'nivel_prioridad' => 4],
            ['nombre' => 'Operaciones', 'edificio' => 'Edificio B', 'nivel_prioridad' => 2],
            ['nombre' => 'Logistica', 'edificio' => 'Edificio D', 'nivel_prioridad' => 3],
            ['nombre' => 'Calidad', 'edificio' => 'Edificio B', 'nivel_prioridad' => 3],
            ['nombre' => 'Produccion', 'edificio' => 'Edificio D', 'nivel_prioridad' => 2],
            ['nombre' => 'Compras', 'edificio' => 'Edificio A', 'nivel_prioridad' => 4],
            ['nombre' => 'Atencion al Cliente', 'edificio' => 'Edificio C', 'nivel_prioridad' => 1],
            ['nombre' => 'Legal', 'edificio' => 'Edificio A', 'nivel_prioridad' => 5],
            ['nombre' => 'Direccion General', 'edificio' => 'Edificio Principal', 'nivel_prioridad' => 5],
        ];

        foreach ($areas as $area) {
            Area::create($area);
        }
    }
}
