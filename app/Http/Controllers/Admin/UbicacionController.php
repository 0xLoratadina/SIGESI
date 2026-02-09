<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ActualizarUbicacionRequest;
use App\Http\Requests\Admin\CrearUbicacionRequest;
use App\Models\Ubicacion;
use Illuminate\Http\RedirectResponse;

class UbicacionController extends Controller
{
    public function store(CrearUbicacionRequest $request): RedirectResponse
    {
        Ubicacion::create($request->validated());

        return back();
    }

    public function update(ActualizarUbicacionRequest $request, Ubicacion $ubicacion): RedirectResponse
    {
        $ubicacion->update($request->validated());

        return back();
    }

    public function destroy(Ubicacion $ubicacion): RedirectResponse
    {
        if ($ubicacion->tickets()->exists()) {
            return back()->withErrors(['general' => 'No se puede eliminar: tiene tickets asociados.']);
        }

        $ubicacion->delete();

        return back();
    }
}
