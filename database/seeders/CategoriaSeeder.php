<?php

namespace Database\Seeders;

use App\Models\Categoria;
use Illuminate\Database\Seeder;

class CategoriaSeeder extends Seeder
{
    public function run(): void
    {
        $categorias = [
            'Red e Internet' => [
                'descripcion' => 'Problemas de conectividad, red local y acceso a internet',
                'hijas' => ['Sin conexion', 'Velocidad lenta', 'Configuracion de red', 'WiFi'],
            ],
            'Hardware' => [
                'descripcion' => 'Equipos de computo, perifericos y componentes fisicos',
                'hijas' => ['Equipo no enciende', 'Periferico danado', 'Impresora', 'Proyector'],
            ],
            'Software' => [
                'descripcion' => 'Instalacion, actualizacion y errores de software',
                'hijas' => ['Instalacion', 'Actualizacion', 'Error en sistema', 'Licencias'],
            ],
            'Servidores y BD' => [
                'descripcion' => 'Servidores, bases de datos y servicios de infraestructura',
                'hijas' => ['Servidor caido', 'Base de datos', 'Respaldos', 'Almacenamiento'],
            ],
            'Telecomunicaciones' => [
                'descripcion' => 'Telefonia, videoconferencia y comunicaciones',
                'hijas' => ['Telefonia', 'Videoconferencia', 'Radio'],
            ],
            'Correo Electronico' => [
                'descripcion' => 'Cuentas de correo institucional y configuracion',
                'hijas' => ['Cuenta nueva', 'Recuperar acceso', 'Configuracion'],
            ],
            'Otros' => [
                'descripcion' => 'Solicitudes que no encajan en las categorias anteriores',
                'hijas' => [],
            ],
        ];

        foreach ($categorias as $nombre => $datos) {
            $padre = Categoria::create([
                'nombre' => $nombre,
                'descripcion' => $datos['descripcion'],
            ]);

            foreach ($datos['hijas'] as $hija) {
                Categoria::create([
                    'nombre' => $hija,
                    'padre_id' => $padre->id,
                ]);
            }
        }
    }
}
