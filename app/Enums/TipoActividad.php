<?php

namespace App\Enums;

enum TipoActividad: string
{
    case CambioEstado = 'CambioEstado';
    case Asignacion = 'Asignacion';
    case CambioPrioridad = 'CambioPrioridad';
    case CambioCategoria = 'CambioCategoria';
    case Comentario = 'Comentario';
    case Adjunto = 'Adjunto';
}
