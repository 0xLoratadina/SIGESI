<?php

namespace App\Jobs;

use App\Models\WhatsAppContacto;
use App\Models\WhatsAppMensaje;
use App\Services\WhatsApp\WhatsAppBotService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessWhatsAppMessage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public function __construct(
        private int $contactoId,
        private int $mensajeId,
    ) {}

    public function handle(WhatsAppBotService $bot): void
    {
        $contacto = WhatsAppContacto::find($this->contactoId);
        $mensaje = WhatsAppMensaje::find($this->mensajeId);

        if (! $contacto || ! $mensaje) {
            return;
        }

        $bot->procesarMensaje($contacto, $mensaje);
    }
}
