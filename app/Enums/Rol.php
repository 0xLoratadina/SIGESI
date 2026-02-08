<?php

namespace App\Enums;

enum Rol: string
{
    case Administrador = 'Administrador';
    case Tecnico = 'Tecnico';
    case Solicitante = 'Solicitante';
}
