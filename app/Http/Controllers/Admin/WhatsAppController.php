<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\WhatsApp\WhatsAppService;
use Inertia\Inertia;
use Inertia\Response;

class WhatsAppController extends Controller
{
    public function __construct(
        private WhatsAppService $whatsAppService
    ) {}

    public function index(): Response
    {
        return Inertia::render('admin/whatsapp/index', [
            'chats' => $this->whatsAppService->getChats(),
            'mensajes' => $this->whatsAppService->getMensajesPorChat(),
            'tickets' => $this->whatsAppService->getTicketsPorChat(),
            'estadoConexion' => $this->whatsAppService->getEstadoConexion(),
        ]);
    }
}
