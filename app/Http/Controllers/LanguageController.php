<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LanguageController extends Controller
{
    public function switchLanguage(Request $request, string $locale): RedirectResponse
    {
        if (in_array($locale, ['hi', 'en'], true)) {
            $request->session()->put('locale', $locale);
        }

        return back();
    }
}
