<?php

namespace App\Enums;

enum EstadoArticulo: string
{
    case Borrador = 'Borrador';
    case Publicado = 'Publicado';
    case Archivado = 'Archivado';
}
