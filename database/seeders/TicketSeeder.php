<?php

namespace Database\Seeders;

use App\Enums\Canal;
use App\Enums\EstadoTicket;
use App\Models\Categoria;
use App\Models\Departamento;
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
        $tecnico1 = User::where('email', 'carlos.martinez@sigesi.com')->first();
        $tecnico2 = User::where('email', 'ana.garcia@sigesi.com')->first();
        $solicitantes = User::where('rol', 'Solicitante')->get();

        $prioridades = Prioridad::all();
        $categorias = Categoria::whereNotNull('padre_id')->get();
        $ubicaciones = Ubicacion::all();

        $numero = 1;
        $generarNumero = function () use (&$numero) {
            return 'INC-'.date('Y').'-'.str_pad($numero++, 4, '0', STR_PAD_LEFT);
        };

        // Tickets Abiertos (sin asignar)
        foreach (range(1, 3) as $i) {
            $solicitante = $solicitantes->random();
            Ticket::create([
                'numero' => $generarNumero(),
                'titulo' => fake()->randomElement([
                    'No tengo acceso a internet en mi oficina',
                    'La impresora del laboratorio no funciona',
                    'Solicitud de instalacion de software',
                    'Mi computadora se reinicia sola',
                ]),
                'descripcion' => fake()->paragraph(2),
                'solicitante_id' => $solicitante->id,
                'creador_id' => $solicitante->id,
                'departamento_id' => $solicitante->departamento_id ?? Departamento::first()->id,
                'categoria_id' => $categorias->random()->id,
                'prioridad_id' => $prioridades->random()->id,
                'ubicacion_id' => $ubicaciones->random()->id,
                'canal' => Canal::Web,
                'estado' => EstadoTicket::Abierto,
                'fecha_limite' => now()->addHours($prioridades->random()->horas_resolucion),
            ]);
        }

        // Tickets Asignados
        foreach (range(1, 2) as $i) {
            $solicitante = $solicitantes->random();
            $tecnico = fake()->randomElement([$tecnico1, $tecnico2]);
            Ticket::create([
                'numero' => $generarNumero(),
                'titulo' => fake()->randomElement([
                    'Configurar red en aula nueva',
                    'Actualizar sistema operativo',
                ]),
                'descripcion' => fake()->paragraph(2),
                'solicitante_id' => $solicitante->id,
                'creador_id' => $admin->id,
                'departamento_id' => $solicitante->departamento_id ?? Departamento::first()->id,
                'categoria_id' => $categorias->random()->id,
                'prioridad_id' => $prioridades->random()->id,
                'ubicacion_id' => $ubicaciones->random()->id,
                'canal' => Canal::Presencial,
                'estado' => EstadoTicket::Asignado,
                'tecnico_id' => $tecnico->id,
                'asignado_por' => $admin->id,
                'fecha_asignacion' => now()->subHours(2),
                'fecha_limite' => now()->addHours(20),
            ]);
        }

        // Tickets En Progreso
        foreach (range(1, 3) as $i) {
            $solicitante = $solicitantes->random();
            $tecnico = fake()->randomElement([$tecnico1, $tecnico2]);
            Ticket::create([
                'numero' => $generarNumero(),
                'titulo' => fake()->randomElement([
                    'Falla en el servidor de correo',
                    'Proyector del aula magna no enciende',
                    'Lentitud en red de laboratorio',
                ]),
                'descripcion' => fake()->paragraph(2),
                'solicitante_id' => $solicitante->id,
                'creador_id' => $solicitante->id,
                'departamento_id' => $solicitante->departamento_id ?? Departamento::first()->id,
                'categoria_id' => $categorias->random()->id,
                'prioridad_id' => $prioridades->random()->id,
                'ubicacion_id' => $ubicaciones->random()->id,
                'canal' => fake()->randomElement([Canal::Web, Canal::WhatsApp, Canal::Telefono]),
                'estado' => EstadoTicket::EnProgreso,
                'tecnico_id' => $tecnico->id,
                'asignado_por' => $admin->id,
                'fecha_asignacion' => now()->subDays(1),
                'fecha_limite' => now()->addHours(10),
            ]);
        }

        // Tickets En Espera
        $solicitante = $solicitantes->random();
        Ticket::create([
            'numero' => $generarNumero(),
            'titulo' => 'Necesito acceso al sistema interno',
            'descripcion' => 'Se requiere informacion adicional del usuario para dar acceso.',
            'solicitante_id' => $solicitante->id,
            'creador_id' => $solicitante->id,
            'departamento_id' => $solicitante->departamento_id ?? Departamento::first()->id,
            'categoria_id' => $categorias->random()->id,
            'prioridad_id' => $prioridades->where('nombre', 'Media')->first()->id,
            'canal' => Canal::Correo,
            'estado' => EstadoTicket::EnEspera,
            'tecnico_id' => $tecnico1->id,
            'asignado_por' => $admin->id,
            'fecha_asignacion' => now()->subDays(2),
            'fecha_limite' => now()->addHours(5),
        ]);

        // Tickets Resueltos
        foreach (range(1, 3) as $i) {
            $solicitante = $solicitantes->random();
            $tecnico = fake()->randomElement([$tecnico1, $tecnico2]);
            Ticket::create([
                'numero' => $generarNumero(),
                'titulo' => fake()->randomElement([
                    'Reinstalacion de Office completada',
                    'Cable de red reemplazado',
                    'Impresora configurada correctamente',
                ]),
                'descripcion' => fake()->paragraph(2),
                'solicitante_id' => $solicitante->id,
                'creador_id' => $solicitante->id,
                'departamento_id' => $solicitante->departamento_id ?? Departamento::first()->id,
                'categoria_id' => $categorias->random()->id,
                'prioridad_id' => $prioridades->random()->id,
                'canal' => Canal::Web,
                'estado' => EstadoTicket::Resuelto,
                'tecnico_id' => $tecnico->id,
                'asignado_por' => $admin->id,
                'fecha_asignacion' => now()->subDays(3),
                'fecha_resolucion' => now()->subDay(),
                'solucion' => fake()->paragraph(),
                'fecha_limite' => now()->addDays(2),
            ]);
        }

        // Tickets Cerrados
        foreach (range(1, 3) as $i) {
            $solicitante = $solicitantes->random();
            Ticket::create([
                'numero' => $generarNumero(),
                'titulo' => fake()->randomElement([
                    'Monitor reemplazado exitosamente',
                    'Acceso a WiFi restaurado',
                    'Licencia de software activada',
                ]),
                'descripcion' => fake()->paragraph(2),
                'solicitante_id' => $solicitante->id,
                'creador_id' => $solicitante->id,
                'departamento_id' => $solicitante->departamento_id ?? Departamento::first()->id,
                'categoria_id' => $categorias->random()->id,
                'prioridad_id' => $prioridades->random()->id,
                'canal' => Canal::Web,
                'estado' => EstadoTicket::Cerrado,
                'tecnico_id' => fake()->randomElement([$tecnico1, $tecnico2])->id,
                'asignado_por' => $admin->id,
                'fecha_asignacion' => now()->subDays(7),
                'fecha_resolucion' => now()->subDays(5),
                'fecha_cierre' => now()->subDays(3),
                'solucion' => fake()->paragraph(),
                'calificacion' => fake()->numberBetween(3, 5),
                'comentario_cal' => fake()->sentence(),
                'fecha_limite' => now()->subDays(4),
            ]);
        }

        // Un ticket cancelado
        $solicitante = $solicitantes->first();
        Ticket::create([
            'numero' => $generarNumero(),
            'titulo' => 'Solicitud duplicada - cancelar',
            'descripcion' => 'El usuario creo el ticket por error, ya existe otro ticket para este problema.',
            'solicitante_id' => $solicitante->id,
            'creador_id' => $solicitante->id,
            'departamento_id' => $solicitante->departamento_id ?? Departamento::first()->id,
            'categoria_id' => $categorias->random()->id,
            'prioridad_id' => $prioridades->where('nombre', 'Baja')->first()->id,
            'canal' => Canal::Web,
            'estado' => EstadoTicket::Cancelado,
        ]);
    }
}
