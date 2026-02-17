<?php

namespace App\Enums;

enum EstadoTicketChat: string
{
    case SinTicket = 'sin_ticket';
    case Pendiente = 'pendiente';
    case EnProceso = 'en_proceso';
    case Cerrado = 'cerrado';

    public function etiqueta(): string
    {
        return match ($this) {
            self::SinTicket => 'Sin ticket',
            self::Pendiente => 'Pendiente',
            self::EnProceso => 'En proceso',
            self::Cerrado => 'Cerrado',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::SinTicket => 'gray',
            self::Pendiente => 'yellow',
            self::EnProceso => 'blue',
            self::Cerrado => 'green',
        };
    }
}
