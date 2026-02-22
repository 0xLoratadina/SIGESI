<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ActualizarAreaRequest;
use App\Http\Requests\Admin\CrearAreaRequest;
use App\Models\Area;
use Illuminate\Http\RedirectResponse;

class AreaController extends Controller
{
    public function store(CrearAreaRequest $request): RedirectResponse
    {
        Area::create($request->validated());

        return back();
    }

    public function update(ActualizarAreaRequest $request, Area $area): RedirectResponse
    {
        $area->update($request->validated());

        return back();
    }

    public function destroy(Area $area): RedirectResponse
    {
        if ($area->tickets()->exists() || $area->users()->exists()) {
            return back()->withErrors(['general' => 'No se puede eliminar: tiene tickets o usuarios asociados.']);
        }

        $area->delete();

        return back();
    }
}
