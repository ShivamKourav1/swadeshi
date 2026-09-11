<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocaleMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // Explicit default locale is Hindi ('hi') per requirement
        $locale = $request->session()->get('locale', 'hi');

        if (!in_array($locale, ['hi', 'en'], true)) {
            $locale = 'hi';
        }

        App::setLocale($locale);

        return $next($request);
    }
}
