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
            'areas' => Area::query()->orderBy('nombre')->get(),
            'auxiliares' => User::query()
                ->where('rol', Rol::Auxiliar)
                ->with(['area:id,nombre', 'horariosDisponibilidad'])
                ->orderBy('name')
                ->get(),
        ]);
    }
}
