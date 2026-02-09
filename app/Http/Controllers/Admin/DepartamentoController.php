<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ActualizarDepartamentoRequest;
use App\Http\Requests\Admin\CrearDepartamentoRequest;
use App\Models\Departamento;
use Illuminate\Http\RedirectResponse;

class DepartamentoController extends Controller
{
    public function store(CrearDepartamentoRequest $request): RedirectResponse
    {
        Departamento::create($request->validated());

        return back();
    }

    public function update(ActualizarDepartamentoRequest $request, Departamento $departamento): RedirectResponse
    {
        $departamento->update($request->validated());

        return back();
    }

    public function destroy(Departamento $departamento): RedirectResponse
    {
        if ($departamento->tickets()->exists() || $departamento->users()->exists()) {
            return back()->withErrors(['general' => 'No se puede eliminar: tiene tickets o usuarios asociados.']);
        }

        $departamento->delete();

        return back();
    }
}
