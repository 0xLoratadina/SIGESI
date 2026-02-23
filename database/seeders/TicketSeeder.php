<?php

namespace Database\Seeders;

use App\Enums\EstadoTicket;
use App\Models\Categoria;
use App\Models\Prioridad;
use App\Models\Ticket;
use App\Models\Ubicacion;
use App\Models\User;
use Illuminate\Database\Seeder;

class TicketSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@sigesi.com')->first();
        $auxiliares = User::where('rol', 'Auxiliar')->where('disponible', true)->get();
        $solicitantes = User::where('rol', 'Solicitante')->get();

        $prioridades = Prioridad::all();
        $categorias = Categoria::whereNotNull('padre_id')->get();
        $ubicaciones = Ubicacion::all();
        $titulosAbiertos = [
            'No tengo acceso a internet en mi oficina',
            'La impresora del piso 2 no imprime',
            'Solicitud de instalacion de AutoCAD',
            'Mi computadora se reinicia sola constantemente',
            'No puedo entrar al correo institucional',
            'El telefono de la recepcion no funciona',
            'Necesito acceso a la carpeta compartida de Finanzas',
            'La pantalla de mi laptop parpadea',
            'Solicitud de cuenta para nuevo empleado',
            'El sistema de nomina muestra error al generar reportes',
        ];

        $titulosEnProgreso = [
            'Falla en el servidor de correo electronico',
            'Proyector del aula magna no enciende',
            'Lentitud en red del laboratorio de computo',
            'Configurar VPN para trabajo remoto',
            'Migrar buzones de correo al nuevo servidor',
            'Actualizar antivirus en equipos de Ventas',
            'Reparar cable de red danado en oficina 305',
            'Instalar Office 365 en equipos nuevos',
        ];

        $titulosResueltos = [
            'Reinstalacion de Office completada',
            'Cable de red reemplazado en laboratorio',
            'Impresora configurada correctamente',
            'Acceso a red WiFi restaurado',
            'Cuenta de correo recuperada exitosamente',
            'Disco duro reemplazado en equipo de contabilidad',
            'Software de diseno instalado correctamente',
            'Respaldo de base de datos restaurado',
            'Proyector de sala de juntas reparado',
            'Licencia de Windows activada',
        ];

        $titulosCerrados = [
            'Monitor reemplazado exitosamente',
            'Licencia de software activada',
            'Red del edificio C restaurada',
            'Servidor web migrado correctamente',
            'Sistema de videovigilancia configurado',
            'Extension telefonica asignada',
            'Equipo de computo entregado a nuevo empleado',
            'Acceso a sistema ERP configurado',
            'Impresora de red instalada en piso 3',
            'Backup semanal automatizado configurado',
            'VPN corporativa habilitada para usuario',
            'Cambio de toner en impresora de RH',
        ];

        // ── Abiertos (7 tickets, últimos 3 días) ──
        foreach (array_slice($titulosAbiertos, 0, 7) as $i => $titulo) {
            $solicitante = $solicitantes->random();
            $creado = now()->subHours(fake()->numberBetween(1, 72));

            Ticket::create([
                'titulo' => $titulo,
                'descripcion' => fake()->paragraph(3),
                'solicitante_id' => $solicitante->id,
                'creador_id' => $solicitante->id,
                'area_id' => $solicitante->area_id,
                'categoria_id' => $categorias->random()->id,
                'prioridad_id' => $prioridades->random()->id,
                'ubicacion_id' => fake()->optional(0.6)->randomElement($ubicaciones->pluck('id')->toArray()),
                'estado' => EstadoTicket::Abierto,
                'fecha_limite' => $creado->copy()->addHours($prioridades->random()->horas_resolucion),
                'created_at' => $creado,
                'updated_at' => $creado,
            ]);
        }

        // ── Asignados (4 tickets, últimos 2 días) ──
        for ($i = 0; $i < 4; $i++) {
            $solicitante = $solicitantes->random();
            $auxiliar = $auxiliares->random();
            $creado = now()->subHours(fake()->numberBetween(6, 48));
            $asignado = $creado->copy()->addHours(fake()->numberBetween(1, 4));

            Ticket::create([
                'titulo' => fake()->randomElement([
                    'Configurar red en oficina nueva',
                    'Actualizar sistema operativo en laptop',
                    'Instalar impresora compartida',
                    'Revisar equipo con virus',
                    'Crear cuenta de correo para practicante',
                    'Cambiar contrasena de acceso al servidor',
                ]),
                'descripcion' => fake()->paragraph(2),
                'solicitante_id' => $solicitante->id,
                'creador_id' => fake()->randomElement([$solicitante->id, $admin->id]),
                'area_id' => $solicitante->area_id,
                'categoria_id' => $categorias->random()->id,
                'prioridad_id' => $prioridades->random()->id,
                'ubicacion_id' => fake()->optional(0.5)->randomElement($ubicaciones->pluck('id')->toArray()),
                'estado' => EstadoTicket::Asignado,
                'auxiliar_id' => $auxiliar->id,
                'asignado_por' => $admin->id,
                'fecha_asignacion' => $asignado,
                'fecha_limite' => $creado->copy()->addHours(24),
                'created_at' => $creado,
                'updated_at' => $asignado,
            ]);
        }

        // ── En Progreso (6 tickets, últimos 5 días) ──
        foreach (array_slice($titulosEnProgreso, 0, 6) as $titulo) {
            $solicitante = $solicitantes->random();
            $auxiliar = $auxiliares->random();
            $creado = now()->subDays(fake()->numberBetween(1, 5));
            $asignado = $creado->copy()->addHours(fake()->numberBetween(1, 6));

            Ticket::create([
                'titulo' => $titulo,
                'descripcion' => fake()->paragraph(3),
                'solicitante_id' => $solicitante->id,
                'creador_id' => $solicitante->id,
                'area_id' => $solicitante->area_id,
                'categoria_id' => $categorias->random()->id,
                'prioridad_id' => $prioridades->random()->id,
                'ubicacion_id' => fake()->optional(0.7)->randomElement($ubicaciones->pluck('id')->toArray()),
                'estado' => EstadoTicket::EnProgreso,
                'auxiliar_id' => $auxiliar->id,
                'asignado_por' => $admin->id,
                'fecha_asignacion' => $asignado,
                'fecha_limite' => $creado->copy()->addHours(48),
                'created_at' => $creado,
                'updated_at' => $asignado->copy()->addHours(fake()->numberBetween(1, 12)),
            ]);
        }

        // ── En Espera (3 tickets) ──
        $titulosEspera = [
            'Esperando aprobacion de licencia de software',
            'Pendiente de pieza de repuesto para impresora',
            'Requiere informacion adicional del solicitante',
        ];
        foreach ($titulosEspera as $titulo) {
            $solicitante = $solicitantes->random();
            $auxiliar = $auxiliares->random();
            $creado = now()->subDays(fake()->numberBetween(3, 7));
            $asignado = $creado->copy()->addHours(fake()->numberBetween(2, 8));

            Ticket::create([
                'titulo' => $titulo,
                'descripcion' => fake()->paragraph(2),
                'solicitante_id' => $solicitante->id,
                'creador_id' => $solicitante->id,
                'area_id' => $solicitante->area_id,
                'categoria_id' => $categorias->random()->id,
                'prioridad_id' => $prioridades->where('nombre', 'Media')->first()->id,
                'ubicacion_id' => fake()->optional(0.4)->randomElement($ubicaciones->pluck('id')->toArray()),
                'estado' => EstadoTicket::EnEspera,
                'auxiliar_id' => $auxiliar->id,
                'asignado_por' => $admin->id,
                'fecha_asignacion' => $asignado,
                'fecha_limite' => $creado->copy()->addDays(3),
                'created_at' => $creado,
                'updated_at' => $asignado->copy()->addDays(1),
            ]);
        }

        // ── Resueltos (10 tickets, últimos 10 días) ──
        foreach ($titulosResueltos as $titulo) {
            $solicitante = $solicitantes->random();
            $auxiliar = $auxiliares->random();
            $creado = now()->subDays(fake()->numberBetween(4, 12));
            $asignado = $creado->copy()->addHours(fake()->numberBetween(1, 8));
            $resuelto = $asignado->copy()->addDays(fake()->numberBetween(1, 3));

            Ticket::create([
                'titulo' => $titulo,
                'descripcion' => fake()->paragraph(2),
                'solicitante_id' => $solicitante->id,
                'creador_id' => $solicitante->id,
                'area_id' => $solicitante->area_id,
                'categoria_id' => $categorias->random()->id,
                'prioridad_id' => $prioridades->random()->id,
                'ubicacion_id' => fake()->optional(0.5)->randomElement($ubicaciones->pluck('id')->toArray()),
                'estado' => EstadoTicket::Resuelto,
                'auxiliar_id' => $auxiliar->id,
                'asignado_por' => $admin->id,
                'fecha_asignacion' => $asignado,
                'fecha_resolucion' => $resuelto,
                'solucion' => fake()->paragraph(),
                'fecha_limite' => $creado->copy()->addDays(5),
                'created_at' => $creado,
                'updated_at' => $resuelto,
            ]);
        }

        // ── Cerrados (12 tickets, últimas 2 semanas) ──
        foreach ($titulosCerrados as $titulo) {
            $solicitante = $solicitantes->random();
            $auxiliar = $auxiliares->random();
            $creado = now()->subDays(fake()->numberBetween(7, 14));
            $asignado = $creado->copy()->addHours(fake()->numberBetween(1, 6));
            $resuelto = $asignado->copy()->addDays(fake()->numberBetween(1, 3));
            $cerrado = $resuelto->copy()->addDays(fake()->numberBetween(1, 2));

            Ticket::create([
                'titulo' => $titulo,
                'descripcion' => fake()->paragraph(2),
                'solicitante_id' => $solicitante->id,
                'creador_id' => $solicitante->id,
                'area_id' => $solicitante->area_id,
                'categoria_id' => $categorias->random()->id,
                'prioridad_id' => $prioridades->random()->id,
                'ubicacion_id' => fake()->optional(0.5)->randomElement($ubicaciones->pluck('id')->toArray()),
                'estado' => EstadoTicket::Cerrado,
                'auxiliar_id' => $auxiliar->id,
                'asignado_por' => $admin->id,
                'fecha_asignacion' => $asignado,
                'fecha_resolucion' => $resuelto,
                'fecha_cierre' => $cerrado,
                'solucion' => fake()->paragraph(),
                'calificacion' => fake()->numberBetween(2, 5),
                'comentario_cal' => fake()->optional(0.7)->sentence(),
                'fecha_limite' => $creado->copy()->addDays(5),
                'created_at' => $creado,
                'updated_at' => $cerrado,
            ]);
        }

        // ── Cancelados (3 tickets) ──
        $titulosCancelados = [
            'Solicitud duplicada - cancelar',
            'Ya no se requiere el software solicitado',
            'Error al crear ticket - problema resuelto por cuenta propia',
        ];
        foreach ($titulosCancelados as $titulo) {
            $solicitante = $solicitantes->random();
            $creado = now()->subDays(fake()->numberBetween(2, 10));

            Ticket::create([
                'titulo' => $titulo,
                'descripcion' => fake()->sentence(10),
                'solicitante_id' => $solicitante->id,
                'creador_id' => $solicitante->id,
                'area_id' => $solicitante->area_id,
                'categoria_id' => $categorias->random()->id,
                'prioridad_id' => $prioridades->where('nombre', 'Baja')->first()->id,
                'estado' => EstadoTicket::Cancelado,
                'created_at' => $creado,
                'updated_at' => $creado->copy()->addHours(fake()->numberBetween(1, 24)),
            ]);
        }

        // ── Tickets adicionales creados por admin en nombre de solicitantes ──
        for ($i = 0; $i < 5; $i++) {
            $solicitante = $solicitantes->random();
            $auxiliar = $auxiliares->random();
            $creado = now()->subDays(fake()->numberBetween(1, 8));
            $asignado = $creado->copy()->addMinutes(fake()->numberBetween(10, 60));

            Ticket::create([
                'titulo' => fake()->randomElement([
                    'Reporte telefonico: equipo no enciende',
                    'Solicitud presencial: acceso a sistema',
                    'Reporte por correo: impresora atascada',
                    'WhatsApp: no puedo acceder a mi correo',
                    'Llamada: internet muy lento en oficina',
                ]),
                'descripcion' => fake()->paragraph(2),
                'solicitante_id' => $solicitante->id,
                'creador_id' => $admin->id,
                'area_id' => $solicitante->area_id,
                'categoria_id' => $categorias->random()->id,
                'prioridad_id' => $prioridades->random()->id,
                'ubicacion_id' => fake()->optional(0.6)->randomElement($ubicaciones->pluck('id')->toArray()),
                'estado' => fake()->randomElement([EstadoTicket::Asignado, EstadoTicket::EnProgreso]),
                'auxiliar_id' => $auxiliar->id,
                'asignado_por' => $admin->id,
                'fecha_asignacion' => $asignado,
                'fecha_limite' => $creado->copy()->addHours(24),
                'created_at' => $creado,
                'updated_at' => $asignado,
            ]);
        }
    }
}
