<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizeInput
{
    protected array $except = [
        'password',
        'password_confirmation',
        'current_password',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        // First check if any string field contains forbidden raw HTML angle brackets (< or >)
        foreach ($request->all() as $key => $value) {
            if (is_string($value) && !in_array($key, $this->except, true)) {
                if (str_contains($value, '<') || str_contains($value, '>')) {
                    return back()->withErrors([
                        $key => "The {$key} field contains invalid characters like < or >.",
                    ])->withInput();
                }
            }
        }

        // Sanitize and trim all string inputs
        $input = $request->all();
        array_walk_recursive($input, function (&$val, $k) {
            if (is_string($val) && !in_array($k, $this->except, true)) {
                $val = trim(htmlspecialchars(strip_tags($val), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));
            }
        });

        $request->merge($input);

        return $next($request);
    }
}
