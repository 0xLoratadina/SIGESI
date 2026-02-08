<?php

namespace Database\Seeders;

use App\Models\Configuracion;
use Illuminate\Database\Seeder;

class ConfiguracionSeeder extends Seeder
{
    public function run(): void
    {
        $configuraciones = [
            ['clave' => 'dias_cierre_auto', 'valor' => '7', 'tipo' => 'integer', 'grupo' => 'tickets', 'descripcion' => 'Dias para cerrar automaticamente un ticket resuelto sin calificacion'],
            ['clave' => 'tamano_max_adjunto', 'valor' => '10485760', 'tipo' => 'integer', 'grupo' => 'adjuntos', 'descripcion' => 'Tamano maximo de archivo adjunto en bytes (10 MB)'],
            ['clave' => 'formatos_permitidos', 'valor' => 'jpg,png,pdf,doc,docx,xlsx', 'tipo' => 'string', 'grupo' => 'adjuntos', 'descripcion' => 'Extensiones de archivo permitidas separadas por coma'],
            ['clave' => 'prefijo_ticket', 'valor' => 'INC', 'tipo' => 'string', 'grupo' => 'tickets', 'descripcion' => 'Prefijo para el numero de ticket'],
            ['clave' => 'notificar_sla_excedido', 'valor' => 'true', 'tipo' => 'boolean', 'grupo' => 'notificaciones', 'descripcion' => 'Enviar notificacion cuando un ticket excede su SLA'],
        ];

        foreach ($configuraciones as $config) {
            Configuracion::create($config);
        }
    }
}
