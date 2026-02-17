<?php

namespace Database\Seeders;

use App\Enums\EstadoTicketChat;
use App\Enums\TipoMensajeWhatsApp;
use App\Models\WhatsAppContacto;
use App\Models\WhatsAppMensaje;
use Illuminate\Database\Seeder;

class WhatsAppSeeder extends Seeder
{
    public function run(): void
    {
        // Crear contactos con conversaciones de ejemplo
        $this->crearConversacionJoseLuis();
        $this->crearConversacionMaria();
        $this->crearConversacionErnesto();

        // Crear algunos contactos adicionales aleatorios
        WhatsAppContacto::factory()
            ->count(3)
            ->create()
            ->each(function (WhatsAppContacto $contacto) {
                WhatsAppMensaje::factory()
                    ->count(rand(1, 5))
                    ->for($contacto, 'contacto')
                    ->create();
            });
    }

    private function crearConversacionJoseLuis(): void
    {
        $contacto = WhatsAppContacto::create([
            'whatsapp_id' => '5215551234567',
            'telefono' => '+52 555 123 4567',
            'nombre' => 'José Luis Flores',
            'en_linea' => true,
            'estado_ticket' => EstadoTicketChat::EnProceso,
        ]);

        $mensajes = [
            ['tipo' => 'recibido', 'contenido' => 'Buen día soy José Luis Flores maestro de Petrolera del P14, tenemos un problema de red en el salón', 'leido' => true, 'es_bot' => false, 'minutos' => -10],
            ['tipo' => 'enviado', 'contenido' => "¡Hola José Luis! Entendí lo siguiente:\n\nProblema: Red no funciona\nUbicación: Edificio P, Salón 14\nSolicitante: José Luis Flores (Maestro - Petrolera)\n\n¿Es correcto? Responde 'sí' para crear el ticket.", 'leido' => true, 'es_bot' => true, 'minutos' => -9],
            ['tipo' => 'recibido', 'contenido' => 'Sí, es correcto', 'leido' => true, 'es_bot' => false, 'minutos' => -8],
            ['tipo' => 'enviado', 'contenido' => "Ticket #TK-0023 creado exitosamente\n\nUn técnico será asignado pronto. Te notificaremos cuando haya novedades.", 'leido' => true, 'es_bot' => true, 'minutos' => -7],
            ['tipo' => 'enviado', 'contenido' => 'Hola José Luis, soy Carlos del área de soporte. Ya voy en camino al salón P-14 para revisar el problema de red.', 'leido' => true, 'es_bot' => false, 'minutos' => -5],
            ['tipo' => 'recibido', 'contenido' => 'Perfecto, aquí lo esperamos. Gracias!', 'leido' => true, 'es_bot' => false, 'minutos' => -4],
            ['tipo' => 'recibido', 'contenido' => 'Buen día, tenemos un problema con el proyector del salón P-14', 'leido' => false, 'es_bot' => false, 'minutos' => -2],
            ['tipo' => 'recibido', 'contenido' => 'No enciende, ya revisamos los cables y todo está conectado', 'leido' => false, 'es_bot' => false, 'minutos' => -1],
        ];

        $this->crearMensajes($contacto, $mensajes);
    }

    private function crearConversacionMaria(): void
    {
        $contacto = WhatsAppContacto::create([
            'whatsapp_id' => '5215552345678',
            'telefono' => '+52 555 234 5678',
            'nombre' => 'María González',
            'en_linea' => false,
            'estado_ticket' => EstadoTicketChat::Cerrado,
        ]);

        $mensajes = [
            ['tipo' => 'recibido', 'contenido' => 'Hola, el proyector del salón K-102 no enciende', 'leido' => true, 'es_bot' => false, 'minutos' => -120],
            ['tipo' => 'enviado', 'contenido' => "¡Hola! Entendí lo siguiente:\n\nProblema: Proyector no enciende\nUbicación: K-102\n\n¿Es correcto?", 'leido' => true, 'es_bot' => true, 'minutos' => -119],
            ['tipo' => 'recibido', 'contenido' => 'Sí', 'leido' => true, 'es_bot' => false, 'minutos' => -118],
            ['tipo' => 'enviado', 'contenido' => "Ticket #TK-0024 creado\n\nProyector no enciende\nK-102\n\nUn técnico será asignado pronto.", 'leido' => true, 'es_bot' => true, 'minutos' => -117],
            ['tipo' => 'enviado', 'contenido' => 'El técnico Carlos López está en camino.', 'leido' => true, 'es_bot' => false, 'minutos' => -90],
            ['tipo' => 'recibido', 'contenido' => 'Ok gracias, lo esperamos', 'leido' => true, 'es_bot' => false, 'minutos' => -89],
            ['tipo' => 'enviado', 'contenido' => 'Ya llegué al salón. El problema era el cable de alimentación que estaba desconectado. Ya está funcionando.', 'leido' => true, 'es_bot' => false, 'minutos' => -60],
            ['tipo' => 'recibido', 'contenido' => 'Ya quedó solucionado, gracias!', 'leido' => true, 'es_bot' => false, 'minutos' => -30],
        ];

        $this->crearMensajes($contacto, $mensajes);
    }

    private function crearConversacionErnesto(): void
    {
        $contacto = WhatsAppContacto::create([
            'whatsapp_id' => '5215553456789',
            'telefono' => '+52 555 345 6789',
            'nombre' => 'Ernesto López',
            'en_linea' => false,
            'estado_ticket' => EstadoTicketChat::Pendiente,
        ]);

        $mensajes = [
            ['tipo' => 'recibido', 'contenido' => 'Buen día, soy Ernesto López, jefe de carrera Petrolera, solicitamos un centro de cómputo para el día de mañana para los chicos, ¿hay disponibilidad de horario?', 'leido' => false, 'es_bot' => false, 'minutos' => -15],
        ];

        $this->crearMensajes($contacto, $mensajes);
    }

    /**
     * @param  array<int, array<string, mixed>>  $mensajes
     */
    private function crearMensajes(WhatsAppContacto $contacto, array $mensajes): void
    {
        foreach ($mensajes as $mensaje) {
            WhatsAppMensaje::create([
                'whatsapp_id' => fake()->uuid(),
                'contacto_id' => $contacto->id,
                'tipo' => TipoMensajeWhatsApp::from($mensaje['tipo']),
                'contenido' => $mensaje['contenido'],
                'leido' => $mensaje['leido'],
                'es_bot' => $mensaje['es_bot'],
                'enviado_at' => now()->addMinutes($mensaje['minutos']),
            ]);
        }
    }
}
