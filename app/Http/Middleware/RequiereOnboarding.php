<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequiereOnboarding
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && $request->user()->requiereOnboarding()) {
            if (! $request->routeIs('onboarding.*') && ! $request->routeIs('logout')) {
                return redirect()->route('onboarding.index');
            }
        }

        return $next($request);
    }
}
