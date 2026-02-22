<?php

namespace Database\Seeders;

use App\Enums\Dia;
use App\Models\HorarioAuxiliar;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // ── Administradores ──
        User::factory()->administrador()->create([
            'name' => 'Administrador del Sistema',
            'email' => 'admin@sigesi.com',
            'num_empleado' => 'ADM001',
            'cargo' => 'Administrador de Soporte',
        ]);

        User::factory()->administrador()->create([
            'name' => 'Diana Reyes Morales',
            'email' => 'diana.reyes@sigesi.com',
            'num_empleado' => 'ADM002',
            'cargo' => 'Coordinadora de TI',
        ]);

        // ── Auxiliares ──
        $carlos = User::factory()->auxiliar()->create([
            'name' => 'Carlos Martinez Lopez',
            'email' => 'carlos.martinez@sigesi.com',
            'num_empleado' => 'AUX001',
            'cargo' => 'Auxiliar en Soporte',
            'whatsapp_telefono' => '9221234567',
            'especialidades' => 'redes, servidores, cableado estructurado',
            'area_id' => 1,
        ]);

        $ana = User::factory()->auxiliar()->create([
            'name' => 'Ana Garcia Ruiz',
            'email' => 'ana.garcia@sigesi.com',
            'num_empleado' => 'AUX002',
            'cargo' => 'Auxiliar en Redes',
            'whatsapp_telefono' => '9229876543',
            'especialidades' => 'impresoras, computadoras, instalacion de software',
            'area_id' => 1,
        ]);

        $pedro = User::factory()->auxiliar()->create([
            'name' => 'Pedro Hernandez Vega',
            'email' => 'pedro.hernandez@sigesi.com',
            'num_empleado' => 'AUX003',
            'cargo' => 'Auxiliar en Sistemas',
            'whatsapp_telefono' => '9225551234',
            'especialidades' => 'correo electronico, cuentas de usuario, active directory',
            'area_id' => 2,
        ]);

        $lucia = User::factory()->auxiliar()->create([
            'name' => 'Lucia Fernandez Castro',
            'email' => 'lucia.fernandez@sigesi.com',
            'num_empleado' => 'AUX004',
            'cargo' => 'Auxiliar en Desarrollo',
            'whatsapp_telefono' => '9223334455',
            'especialidades' => 'paginas web, bases de datos, sistemas internos',
            'area_id' => 4,
        ]);

        $miguel = User::factory()->auxiliar()->create([
            'name' => 'Miguel Angel Rios',
            'email' => 'miguel.rios@sigesi.com',
            'num_empleado' => 'AUX005',
            'cargo' => 'Auxiliar en Infraestructura',
            'whatsapp_telefono' => '9227778899',
            'especialidades' => 'servidores, virtualizacion, respaldos, seguridad informatica',
            'area_id' => 3,
        ]);

        $sofia = User::factory()->auxiliar()->create([
            'name' => 'Sofia Ramirez Ortiz',
            'email' => 'sofia.ramirez@sigesi.com',
            'num_empleado' => 'AUX006',
            'cargo' => 'Auxiliar en Soporte',
            'whatsapp_telefono' => '9226665544',
            'especialidades' => 'telefonos, proyectores, equipo audiovisual, camaras',
            'area_id' => 1,
            'disponible' => false,
        ]);

        // ── Horarios de auxiliares ──
        $this->crearHorarios($carlos, [
            Dia::Lunes, Dia::Martes, Dia::Miercoles, Dia::Jueves, Dia::Viernes,
        ], '08:00', '16:00');

        $this->crearHorarios($ana, [
            Dia::Lunes, Dia::Martes, Dia::Miercoles, Dia::Jueves, Dia::Viernes,
        ], '09:00', '17:00');

        $this->crearHorarios($pedro, [
            Dia::Lunes, Dia::Martes, Dia::Miercoles, Dia::Jueves,
        ], '08:00', '15:00');

        $this->crearHorarios($lucia, [
            Dia::Lunes, Dia::Miercoles, Dia::Viernes,
        ], '10:00', '18:00');

        $this->crearHorarios($miguel, [
            Dia::Lunes, Dia::Martes, Dia::Miercoles, Dia::Jueves, Dia::Viernes, Dia::Sabado,
        ], '07:00', '15:00');

        // Sofia no tiene horarios (no disponible)

        // ── Solicitantes ──
        User::factory()->solicitante()->create([
            'name' => 'Maria Lopez Hernandez',
            'email' => 'maria.lopez@sigesi.com',
            'num_empleado' => 'EMP001',
            'cargo' => 'Coordinadora de Control Escolar',
            'area_id' => 5,
        ]);

        User::factory()->solicitante()->create([
            'name' => 'Roberto Sanchez Perez',
            'email' => 'roberto.sanchez@sigesi.com',
            'num_empleado' => 'EMP002',
            'cargo' => 'Analista Financiero',
            'area_id' => 7,
        ]);

        User::factory()->solicitante()->create([
            'name' => 'Laura Torres Diaz',
            'email' => 'laura.torres@sigesi.com',
            'num_empleado' => 'EMP003',
            'cargo' => 'Ejecutiva de Ventas',
            'area_id' => 8,
        ]);

        User::factory()->solicitante()->create([
            'name' => 'Fernando Gutierrez Nava',
            'email' => 'fernando.gutierrez@sigesi.com',
            'num_empleado' => 'EMP004',
            'cargo' => 'Jefe de Recursos Humanos',
            'area_id' => 6,
        ]);

        User::factory()->solicitante()->create([
            'name' => 'Patricia Mendoza Luna',
            'email' => 'patricia.mendoza@sigesi.com',
            'num_empleado' => 'EMP005',
            'cargo' => 'Asistente de Direccion',
            'area_id' => 17,
        ]);

        User::factory()->solicitante()->create([
            'name' => 'Jorge Vargas Soto',
            'email' => 'jorge.vargas@sigesi.com',
            'num_empleado' => 'EMP006',
            'cargo' => 'Supervisor de Operaciones',
            'area_id' => 10,
        ]);

        User::factory()->solicitante()->create([
            'name' => 'Carmen Flores Jimenez',
            'email' => 'carmen.flores@sigesi.com',
            'num_empleado' => 'EMP007',
            'cargo' => 'Encargada de Compras',
            'area_id' => 14,
        ]);

        User::factory()->solicitante()->create([
            'name' => 'Ricardo Aguilar Ponce',
            'email' => 'ricardo.aguilar@sigesi.com',
            'num_empleado' => 'EMP008',
            'cargo' => 'Coordinador de Logistica',
            'area_id' => 11,
        ]);

        User::factory()->solicitante()->create([
            'name' => 'Elena Cruz Moreno',
            'email' => 'elena.cruz@sigesi.com',
            'num_empleado' => 'EMP009',
            'cargo' => 'Diseñadora de Marketing',
            'area_id' => 9,
        ]);

        User::factory()->solicitante()->create([
            'name' => 'Alejandro Dominguez Rios',
            'email' => 'alejandro.dominguez@sigesi.com',
            'num_empleado' => 'EMP010',
            'cargo' => 'Inspector de Calidad',
            'area_id' => 12,
        ]);
    }

    private function crearHorarios(User $usuario, array $dias, string $inicio, string $fin): void
    {
        foreach ($dias as $dia) {
            HorarioAuxiliar::create([
                'user_id' => $usuario->id,
                'dia' => $dia,
                'hora_inicio' => $inicio,
                'hora_fin' => $fin,
            ]);
        }
    }
}
