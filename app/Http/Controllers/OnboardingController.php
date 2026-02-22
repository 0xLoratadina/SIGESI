<?php

namespace App\Http\Controllers;

use App\Http\Requests\CompletarOnboardingRequest;
use App\Models\Area;
use App\Models\Ubicacion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        if (! $request->user()->requiereOnboarding()) {
            return to_route('dashboard');
        }

        return Inertia::render('onboarding/index', [
            'areas' => Area::query()
                ->where('activo', true)
                ->select('id', 'nombre')
                ->orderBy('nombre')
                ->get(),
            'ubicaciones' => Ubicacion::query()
                ->where('activo', true)
                ->select('id', 'nombre', 'area_id')
                ->orderBy('nombre')
                ->get(),
            'debeCambiarPassword' => $request->user()->debe_cambiar_password,
        ]);
    }

    public function cambiarPassword(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'password.required' => 'La contraseña es obligatoria.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
        ]);

        $request->user()->update([
            'password' => Hash::make($request->password),
            'debe_cambiar_password' => false,
        ]);

        return back();
    }

    public function completar(CompletarOnboardingRequest $request): RedirectResponse
    {
        $request->user()->update([
            ...$request->validated(),
            'onboarding_completado' => true,
            'fecha_onboarding' => now(),
        ]);

        return to_route('dashboard');
    }
}
