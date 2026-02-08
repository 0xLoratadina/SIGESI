<?php

namespace App\Enums;

enum Canal: string
{
    case Web = 'Web';
    case WhatsApp = 'WhatsApp';
    case Telefono = 'Telefono';
    case Correo = 'Correo';
    case Presencial = 'Presencial';
}
