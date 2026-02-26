<?php

namespace App\Console\Commands;

use App\Models\WhatsAppContacto;
use App\Models\WhatsAppMensaje;
use Illuminate\Console\Command;

class FusionarContactosLid extends Command
{
    protected $signature = 'whatsapp:fusionar-lid';
    protected $description = 'Fusiona contactos @lid duplicados con sus contactos reales';

    public function handle(): int
    {
        $lids = WhatsAppContacto::where('whatsapp_id', 'LIKE', '%@lid')->get();

        if ($lids->isEmpty()) {
            $this->info('No hay contactos @lid para fusionar.');
            return 0;
        }

        $fusionados = 0;
        $sinCoincidencia = 0;

        foreach ($lids as $lid) {
            $real = $this->buscarContactoReal($lid);

            if ($real) {
                $mensajes = WhatsAppMensaje::where('contacto_id', $lid->id)->count();
                WhatsAppMensaje::where('contacto_id', $lid->id)->update(['contacto_id' => $real->id]);
                $real->update(['lid_id' => $lid->whatsapp_id]);
                $lid->delete();

                $this->line("Fusionado: {$lid->nombre} (lid={$lid->whatsapp_id}) → contacto #{$real->id}, {$mensajes} mensajes movidos");
                $fusionados++;
            } else {
                $this->warn("Sin coincidencia: {$lid->nombre} ({$lid->whatsapp_id})");
                $sinCoincidencia++;
            }
        }

        $this->info("Listo. Fusionados: {$fusionados}, sin coincidencia: {$sinCoincidencia}");
        return 0;
    }

    private function buscarContactoReal(WhatsAppContacto $lid): ?WhatsAppContacto
    {
        $numero = str_replace('@lid', '', $lid->whatsapp_id);

        // 1. Por número limpio en el JID
        if (is_numeric($numero)) {
            $contacto = WhatsAppContacto::where('telefono', $numero)
                ->where('whatsapp_id', 'NOT LIKE', '%@lid')
                ->first();
            if ($contacto) return $contacto;
        }

        // 2. Por nombre (ignorando si el nombre es el propio JID o número)
        $nombre = $lid->nombre;
        if ($nombre && $nombre !== $lid->whatsapp_id && $nombre !== $numero && !str_ends_with($nombre, '@lid')) {
            $contacto = WhatsAppContacto::where('nombre', $nombre)
                ->where('whatsapp_id', 'NOT LIKE', '%@lid')
                ->where('id', '!=', $lid->id)
                ->first();
            if ($contacto) return $contacto;
        }

        return null;
    }
}
