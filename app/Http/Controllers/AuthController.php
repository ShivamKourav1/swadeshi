<?php

namespace App\Http\Controllers;

use App\Models\Jila;
use App\Models\Kshetra;
use App\Models\Nagar;
use App\Models\Prant;
use App\Models\Shakha;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\Vibhag;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    public function showLogin(): Response
    {
        return Inertia::render('Auth/Login', [
            'showDemoCredentials' => (bool) config('app.show_demo_users', !app()->isProduction()),
        ]);
    }

    public function login(Request $request): RedirectResponse
    {
        $loginId = trim($request->input('login_id') ?? $request->input('email') ?? '');
        $password = $request->input('password');

        $request->validate([
            'password' => ['required', 'string'],
        ]);

        if (empty($loginId)) {
            return back()->withErrors([
                'email' => 'Email address or mobile number is required.',
            ])->onlyInput('email');
        }

        // Normalize phone: strip non-numeric characters for digits matching
        $cleanPhone = preg_replace('/[^\d+]/', '', $loginId);
        $digitsOnly = preg_replace('/\D/', '', $loginId);
        $last10 = strlen($digitsOnly) >= 10 ? substr($digitsOnly, -10) : null;

        // Find user by email (case-insensitive) OR by phone variations
        $user = User::where(function ($query) use ($loginId, $cleanPhone, $digitsOnly, $last10) {
            $query->whereRaw('LOWER(email) = ?', [strtolower($loginId)])
                ->orWhere('phone', $loginId)
                ->orWhere('phone', $cleanPhone);

            if ($digitsOnly) {
                $query->orWhere('phone', $digitsOnly);
            }

            if ($last10) {
                $query->orWhere('phone', $last10)
                    ->orWhere('phone', '+91' . $last10)
                    ->orWhere('phone', '+91 ' . $last10)
                    ->orWhere('phone', '0' . $last10)
                    ->orWhereRaw("REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+91', ''), '+', '') = ?", [$last10]);
            }
        })->first();

        if ($user && Hash::check($password, $user->password)) {
            if ($user->status === 'inactive' || $user->status === 'suspended') {
                return back()->withErrors([
                    'email' => 'Your account is inactive. Please contact system administrator.',
                ])->onlyInput('email');
            }

            Auth::login($user, $request->boolean('remember'));
            $request->session()->regenerate();

            if ($user->isKaryakarta()) {
                return redirect()->intended(route('karyakarta.dashboard'))->with('success', 'Logged in to Karyakarta Panel!');
            }
            return redirect()->intended(route('products.index'))->with('success', 'Logged in successfully!');
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    }

    public function showRegister(): Response
    {
        return Inertia::render('Auth/Register');
    }

    public function register(Request $request): RedirectResponse
    {
        $email = trim($request->input('email') ?? '');
        $phone = trim($request->input('phone') ?? '');

        // Validation: At least one of email or mobile number is required
        if (empty($email) && empty($phone)) {
            return back()->withErrors([
                'email' => 'Either Email Address or Mobile Number is required for registration.',
                'phone' => 'Either Email Address or Mobile Number is required for registration.',
            ])->withInput();
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'regex:/^[^<>]*$/'],
            'email' => ['nullable', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:20', 'regex:/^[^<>]*$/', 'unique:users,phone'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ], [
            'name.regex' => 'The name field cannot contain special characters like < or >.',
            'phone.regex' => 'The phone field cannot contain special characters like < or >.',
            'email.unique' => 'This email address is already registered.',
            'phone.unique' => 'This phone number is already registered.',
        ]);

        // Public registration always assigns the 'customer' role
        $user = User::create([
            'name' => $validated['name'],
            'email' => !empty($validated['email']) ? $validated['email'] : null,
            'password' => Hash::make($validated['password']),
            'role' => 'customer',
            'phone' => !empty($validated['phone']) ? $validated['phone'] : null,
            'status' => 'active',
        ]);

        UserProfile::create([
            'user_id' => $user->id,
        ]);

        Auth::login($user);

        return redirect()->route('products.index')->with('success', 'Account registered successfully!');
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('products.index')->with('success', 'Logged out successfully!');
    }
}
