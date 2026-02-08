<?php

namespace Database\Seeders;

use App\Models\Departamento;
use App\Models\Ubicacion;
use Illuminate\Database\Seeder;

class UbicacionSeeder extends Seeder
{
    public function run(): void
    {
        $soporte = Departamento::where('codigo', 'STEC')->first();
        $sistemas = Departamento::where('codigo', 'SIST')->first();
        $desarrollo = Departamento::where('codigo', 'DESA')->first();
        $operaciones = Departamento::where('codigo', 'OPER')->first();

        $ubicaciones = [
            ['nombre' => 'Sala de Servidores', 'edificio' => 'Edificio Principal', 'piso' => 'Planta Baja', 'salon' => 'SS-01', 'departamento_id' => $soporte?->id],
            ['nombre' => 'Laboratorio de Computo 1', 'edificio' => 'Edificio B', 'piso' => 'Planta Baja', 'salon' => 'Lab-01', 'departamento_id' => $sistemas?->id],
            ['nombre' => 'Laboratorio de Computo 2', 'edificio' => 'Edificio B', 'piso' => 'Planta Baja', 'salon' => 'Lab-02', 'departamento_id' => $sistemas?->id],
            ['nombre' => 'Laboratorio de Redes', 'edificio' => 'Edificio B', 'piso' => 'Piso 1', 'salon' => 'Lab-03', 'departamento_id' => $desarrollo?->id],
            ['nombre' => 'Sala de Juntas', 'edificio' => 'Edificio Principal', 'piso' => 'Piso 1', 'salon' => 'SJ-01', 'departamento_id' => null],
            ['nombre' => 'Recepcion', 'edificio' => 'Edificio A', 'piso' => 'Planta Baja', 'salon' => null, 'departamento_id' => null],
            ['nombre' => 'Almacen', 'edificio' => 'Edificio D', 'piso' => 'Planta Baja', 'salon' => 'AL-01', 'departamento_id' => $operaciones?->id],
            ['nombre' => 'Oficina Administrativa', 'edificio' => 'Edificio A', 'piso' => 'Planta Baja', 'salon' => 'OA-01', 'departamento_id' => null],
        ];

        foreach ($ubicaciones as $ubicacion) {
            Ubicacion::create($ubicacion);
        }
    }
}
