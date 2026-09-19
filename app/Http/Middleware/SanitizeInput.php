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

        // Sanitize, trim, and decode any HTML entities so quotes, inch marks, and symbols remain clean
        $input = $request->all();
        array_walk_recursive($input, function (&$val, $k) {
            if (is_string($val) && !in_array($k, $this->except, true)) {
                $val = trim(strip_tags($val));
                // Automatically decode any existing HTML entities (e.g. &#039;, &quot;, &amp;) so quotes and inch marks don't break
                while (str_contains($val, '&') && preg_match('/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/', $val)) {
                    $prev = $val;
                    $val = html_entity_decode($val, ENT_QUOTES | ENT_HTML5, 'UTF-8');
                    if ($val === $prev) {
                        break;
                    }
                }
            }
        });

        $request->merge($input);

        return $next($request);
    }
}
