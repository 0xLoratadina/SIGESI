<?php

namespace Database\Seeders;

use App\Models\Departamento;
use Illuminate\Database\Seeder;

class DepartamentoSeeder extends Seeder
{
    public function run(): void
    {
        $departamentos = [
            ['nombre' => 'Soporte Tecnico', 'codigo' => 'STEC', 'edificio' => 'Edificio Principal'],
            ['nombre' => 'Sistemas', 'codigo' => 'SIST', 'edificio' => 'Edificio Principal'],
            ['nombre' => 'Redes e Infraestructura', 'codigo' => 'REDE', 'edificio' => 'Edificio Principal'],
            ['nombre' => 'Desarrollo', 'codigo' => 'DESA', 'edificio' => 'Edificio B'],
            ['nombre' => 'Administracion', 'codigo' => 'ADMN', 'edificio' => 'Edificio A'],
            ['nombre' => 'Recursos Humanos', 'codigo' => 'RRHH', 'edificio' => 'Edificio A'],
            ['nombre' => 'Finanzas', 'codigo' => 'FINA', 'edificio' => 'Edificio A'],
            ['nombre' => 'Ventas', 'codigo' => 'VENT', 'edificio' => 'Edificio C'],
            ['nombre' => 'Marketing', 'codigo' => 'MARK', 'edificio' => 'Edificio C'],
            ['nombre' => 'Operaciones', 'codigo' => 'OPER', 'edificio' => 'Edificio B'],
            ['nombre' => 'Logistica', 'codigo' => 'LOGI', 'edificio' => 'Edificio D'],
            ['nombre' => 'Calidad', 'codigo' => 'CALD', 'edificio' => 'Edificio B'],
            ['nombre' => 'Produccion', 'codigo' => 'PROD', 'edificio' => 'Edificio D'],
            ['nombre' => 'Compras', 'codigo' => 'COMP', 'edificio' => 'Edificio A'],
            ['nombre' => 'Atencion al Cliente', 'codigo' => 'ACLI', 'edificio' => 'Edificio C'],
            ['nombre' => 'Legal', 'codigo' => 'LEGA', 'edificio' => 'Edificio A'],
            ['nombre' => 'Direccion General', 'codigo' => 'DGEN', 'edificio' => 'Edificio Principal'],
        ];

        foreach ($departamentos as $depto) {
            Departamento::create($depto);
        }
    }
}
