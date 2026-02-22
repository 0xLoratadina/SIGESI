<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Rol;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ActualizarUsuarioRequest;
use App\Http\Requests\Admin\CrearUsuarioRequest;
use App\Models\Area;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class UsuarioController extends Controller
{
    public function index(Request $request): Response
    {
        $consulta = User::query()->with('area:id,nombre');

        if ($request->filled('rol')) {
            $consulta->where('rol', $request->rol);
        }

        return Inertia::render('admin/usuarios', [
            'usuarios' => $consulta
                ->orderByDesc('created_at')
                ->paginate(15)
                ->withQueryString(),
            'areas' => Area::query()
                ->where('activo', true)
                ->select('id', 'nombre')
                ->orderBy('nombre')
                ->get(),
            'filtroRol' => $request->rol ?? '',
        ]);
    }

    public function store(CrearUsuarioRequest $request): RedirectResponse
    {
        $esAuxiliar = $request->rol === Rol::Auxiliar->value;
        $esSolicitante = $request->rol === Rol::Solicitante->value;
        $passwordTemporal = Str::random(12);

        $usuario = User::create([
            ...$request->validated(),
            'password' => Hash::make($passwordTemporal),
            'debe_cambiar_password' => $esSolicitante,
            'onboarding_completado' => $esAuxiliar || ! $esSolicitante,
        ]);

        $usuario->forceFill(['email_verified_at' => now()])->save();

        return back()->with('credenciales', [
            'nombre' => $usuario->name,
            'email' => $usuario->email,
            'password' => $passwordTemporal,
            'rol' => $usuario->rol->value,
        ]);
    }

    public function update(ActualizarUsuarioRequest $request, User $user): RedirectResponse
    {
        $datos = $request->validated();

        if (! empty($datos['password_temporal'])) {
            $datos['password'] = Hash::make($datos['password_temporal']);
            $datos['debe_cambiar_password'] = true;
        }

        unset($datos['password_temporal']);

        $user->update($datos);

        return back();
    }

    public function destroy(User $user): RedirectResponse
    {
        if ($user->esAdmin()) {
            abort(403, 'No se puede eliminar una cuenta de administrador.');
        }

        if ($user->ticketsSolicitados()->exists() || $user->ticketsCreados()->exists()) {
            $user->update(['activo' => false]);

            return back();
        }

        $user->delete();

        return back();
    }
}
