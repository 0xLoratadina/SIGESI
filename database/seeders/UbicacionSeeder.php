<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\Ubicacion;
use Illuminate\Database\Seeder;

class UbicacionSeeder extends Seeder
{
    public function run(): void
    {
        $soporte = Area::where('nombre', 'Soporte Tecnico')->first();
        $sistemas = Area::where('nombre', 'Sistemas')->first();
        $desarrollo = Area::where('nombre', 'Desarrollo')->first();
        $operaciones = Area::where('nombre', 'Operaciones')->first();

        $ubicaciones = [
            ['nombre' => 'Sala de Servidores', 'edificio' => 'Edificio Principal', 'piso' => 'Planta Baja', 'salon' => 'SS-01', 'area_id' => $soporte?->id],
            ['nombre' => 'Laboratorio de Computo 1', 'edificio' => 'Edificio B', 'piso' => 'Planta Baja', 'salon' => 'Lab-01', 'area_id' => $sistemas?->id],
            ['nombre' => 'Laboratorio de Computo 2', 'edificio' => 'Edificio B', 'piso' => 'Planta Baja', 'salon' => 'Lab-02', 'area_id' => $sistemas?->id],
            ['nombre' => 'Laboratorio de Redes', 'edificio' => 'Edificio B', 'piso' => 'Piso 1', 'salon' => 'Lab-03', 'area_id' => $desarrollo?->id],
            ['nombre' => 'Sala de Juntas', 'edificio' => 'Edificio Principal', 'piso' => 'Piso 1', 'salon' => 'SJ-01', 'area_id' => null],
            ['nombre' => 'Recepcion', 'edificio' => 'Edificio A', 'piso' => 'Planta Baja', 'salon' => null, 'area_id' => null],
            ['nombre' => 'Almacen', 'edificio' => 'Edificio D', 'piso' => 'Planta Baja', 'salon' => 'AL-01', 'area_id' => $operaciones?->id],
            ['nombre' => 'Oficina Administrativa', 'edificio' => 'Edificio A', 'piso' => 'Planta Baja', 'salon' => 'OA-01', 'area_id' => null],
        ];

        foreach ($ubicaciones as $ubicacion) {
            Ubicacion::create($ubicacion);
        }
    }
}
