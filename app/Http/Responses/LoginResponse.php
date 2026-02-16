<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request): Response
    {
        if ($request->wantsJson()) {
            return new JsonResponse('', 200);
        }

        if ($request->user()->requiereOnboarding()) {
            return redirect()->route('onboarding.index');
        }

        return redirect()->intended(route('dashboard'));
    }
}
