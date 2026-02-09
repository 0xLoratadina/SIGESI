<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ActualizarPrioridadRequest;
use App\Http\Requests\Admin\CrearPrioridadRequest;
use App\Models\Prioridad;
use Illuminate\Http\RedirectResponse;

class PrioridadController extends Controller
{
    public function store(CrearPrioridadRequest $request): RedirectResponse
    {
        Prioridad::create($request->validated());

        return back();
    }

    public function update(ActualizarPrioridadRequest $request, Prioridad $prioridad): RedirectResponse
    {
        $prioridad->update($request->validated());

        return back();
    }

    public function destroy(Prioridad $prioridad): RedirectResponse
    {
        if ($prioridad->tickets()->exists()) {
            return back()->withErrors(['general' => 'No se puede eliminar: tiene tickets asociados.']);
        }

        $prioridad->delete();

        return back();
    }
}
