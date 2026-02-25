<?php

namespace App\Http\Controllers;

use App\Models\Adjunto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdjuntoController extends Controller
{
    public function show(Request $request, Adjunto $adjunto): StreamedResponse
    {
        $usuario = $request->user();
        $ticket = $adjunto->ticket;

        if ($usuario->esSolicitante() && $ticket->solicitante_id !== $usuario->id) {
            abort(Response::HTTP_FORBIDDEN);
        }

        if ($usuario->esAuxiliar() && $ticket->auxiliar_id !== $usuario->id) {
            abort(Response::HTTP_FORBIDDEN);
        }

        if (! Storage::disk('local')->exists($adjunto->ruta)) {
            abort(Response::HTTP_NOT_FOUND);
        }

        return Storage::disk('local')->response($adjunto->ruta, $adjunto->nombre, [
            'Content-Type' => $adjunto->tipo_mime,
        ]);
    }
}
