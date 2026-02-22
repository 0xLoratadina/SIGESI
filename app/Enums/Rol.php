<?php

namespace App\Enums;

enum Rol: string
{
    case Administrador = 'Administrador';
    case Auxiliar = 'Auxiliar';
    case Solicitante = 'Solicitante';
}
