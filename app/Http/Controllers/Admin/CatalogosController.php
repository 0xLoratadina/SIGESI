<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Rol;
use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class CatalogosController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('admin/catalogos', [
            'areas' => Area::query()
                ->select('id', 'nombre', 'edificio', 'nivel_prioridad', 'activo')
                ->orderBy('nombre')
                ->get(),
            'auxiliares' => User::query()
                ->select('id', 'name', 'area_id', 'whatsapp_telefono', 'especialidades', 'disponible')
                ->where('rol', Rol::Auxiliar)
                ->with(['area:id,nombre', 'horariosDisponibilidad:id,user_id,dia,hora_inicio,hora_fin'])
                ->orderBy('name')
                ->get(),
        ]);
    }
}
