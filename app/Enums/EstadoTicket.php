<?php

namespace App\Enums;

enum EstadoTicket: string
{
    case Abierto = 'Abierto';
    case Asignado = 'Asignado';
    case EnProgreso = 'EnProgreso';
    case EnEspera = 'EnEspera';
    case Resuelto = 'Resuelto';
    case Cerrado = 'Cerrado';
    case Cancelado = 'Cancelado';

    /** Etiqueta legible para la UI */
    public function etiqueta(): string
    {
        return match ($this) {
            self::EnProgreso => 'En Progreso',
            self::EnEspera => 'En Espera',
            default => $this->value,
        };
    }
}
