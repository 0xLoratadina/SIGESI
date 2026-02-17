<?php

namespace App\Enums;

enum TipoMensajeWhatsApp: string
{
    case Recibido = 'recibido';
    case Enviado = 'enviado';
}
