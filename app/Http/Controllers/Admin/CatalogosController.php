<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Categoria;
use App\Models\Departamento;
use App\Models\Prioridad;
use App\Models\Ubicacion;
use Inertia\Inertia;
use Inertia\Response;

class CatalogosController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('admin/catalogos', [
            'departamentos' => Departamento::query()->orderBy('nombre')->get(),
            'categorias' => Categoria::query()->with('padre:id,nombre')->orderBy('nombre')->get(),
            'prioridades' => Prioridad::query()->orderBy('nivel')->get(),
            'ubicaciones' => Ubicacion::query()->with('departamento:id,nombre')->orderBy('nombre')->get(),
        ]);
    }
}
