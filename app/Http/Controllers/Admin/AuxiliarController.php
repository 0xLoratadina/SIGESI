<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ActualizarAuxiliarRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;

class AuxiliarController extends Controller
{
    public function update(ActualizarAuxiliarRequest $request, User $user): RedirectResponse
    {
        $user->update($request->safe()->except(['horarios']));

        if ($request->has('horarios')) {
            $user->horariosDisponibilidad()->delete();

            foreach ($request->horarios ?? [] as $horario) {
                $user->horariosDisponibilidad()->create($horario);
            }
        }

        return back();
    }
}
