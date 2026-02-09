<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ActualizarCategoriaRequest;
use App\Http\Requests\Admin\CrearCategoriaRequest;
use App\Models\Categoria;
use Illuminate\Http\RedirectResponse;

class CategoriaController extends Controller
{
    public function store(CrearCategoriaRequest $request): RedirectResponse
    {
        Categoria::create($request->validated());

        return back();
    }

    public function update(ActualizarCategoriaRequest $request, Categoria $categoria): RedirectResponse
    {
        $categoria->update($request->validated());

        return back();
    }

    public function destroy(Categoria $categoria): RedirectResponse
    {
        if ($categoria->tickets()->exists()) {
            return back()->withErrors(['general' => 'No se puede eliminar: tiene tickets asociados.']);
        }

        if ($categoria->hijas()->exists()) {
            return back()->withErrors(['general' => 'No se puede eliminar: tiene subcategorías asociadas.']);
        }

        $categoria->delete();

        return back();
    }
}
