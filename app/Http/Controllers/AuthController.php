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
        return Inertia::render('Auth/Login');
    }

    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();
            $user = Auth::user();
            if ($user->role === 'karyakarta') {
                return redirect()->route('karyakarta.dashboard')->with('success', 'Logged in to Karyakarta Panel!');
            }
            return redirect()->intended(route('products.index'))->with('success', 'Logged in successfully!');
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    }

    public function showRegister(): Response
    {
        $orgData = [
            'kshetras' => Kshetra::all(['id', 'kshetra_name']),
            'prants' => Prant::all(['id', 'kshetra_id', 'prant_name']),
            'vibhags' => Vibhag::all(['id', 'prant_id', 'vibhag_name']),
            'jilas' => Jila::all(['id', 'vibhag_id', 'jila_name']),
            'nagars' => Nagar::all(['id', 'jila_id', 'nagar_name']),
            'shakhas' => Shakha::where('status', 'Active')->get(['id', 'nagar_id', 'shakha_name', 'aayu_varg', 'type']),
        ];

        return Inertia::render('Auth/Register', [
            'orgData' => $orgData,
        ]);
    }

    public function register(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'regex:/^[^<>]*$/'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'role' => ['required', 'in:customer,dealer,delivery_partner,karyakarta'],
            'phone' => ['nullable', 'string', 'max:20', 'regex:/^[^<>]*$/'],
            'business_name' => ['nullable', 'required_if:role,dealer', 'string', 'max:255', 'regex:/^[^<>]*$/'],
            'vehicle_type' => ['nullable', 'required_if:role,delivery_partner', 'string', 'max:100', 'regex:/^[^<>]*$/'],
            'vehicle_number' => ['nullable', 'string', 'max:50', 'regex:/^[^<>]*$/'],
            'kshetra_id' => ['nullable', 'exists:kshetras,id'],
            'prant_id' => ['nullable', 'exists:prants,id'],
            'vibhag_id' => ['nullable', 'exists:vibhags,id'],
            'jila_id' => ['nullable', 'exists:jilas,id'],
            'nagar_id' => ['nullable', 'exists:nagars,id'],
            'shakha_id' => ['nullable', 'exists:shakhas,id'],
        ], [
            'name.regex' => 'The name field cannot contain special characters like < or >.',
            'business_name.regex' => 'The business name cannot contain special characters like < or >.',
            'vehicle_type.regex' => 'The vehicle type cannot contain special characters like < or >.',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'phone' => $validated['phone'] ?? null,
            'status' => 'active',
        ]);

        $profileData = [
            'user_id' => $user->id,
            'business_name' => $validated['business_name'] ?? null,
            'vehicle_type' => $validated['vehicle_type'] ?? null,
            'vehicle_number' => $validated['vehicle_number'] ?? null,
            'kshetra_id' => $validated['kshetra_id'] ?? null,
            'prant_id' => $validated['prant_id'] ?? null,
            'vibhag_id' => $validated['vibhag_id'] ?? null,
            'jila_id' => $validated['jila_id'] ?? null,
            'nagar_id' => $validated['nagar_id'] ?? null,
            'shakha_id' => $validated['shakha_id'] ?? null,
        ];

        // Resolve parent organizational IDs if sub-unit selected
        if (!empty($profileData['shakha_id'])) {
            $shakha = Shakha::with('nagar.jila.vibhag.prant.kshetra')->find($profileData['shakha_id']);
            if ($shakha && $shakha->nagar) {
                $profileData['nagar_id'] = $shakha->nagar->id;
                $profileData['jila_id'] = $shakha->nagar->jila_id;
                $profileData['vibhag_id'] = $shakha->nagar->jila?->vibhag_id;
                $profileData['prant_id'] = $shakha->nagar->jila?->vibhag?->prant_id;
                $profileData['kshetra_id'] = $shakha->nagar->jila?->vibhag?->prant?->kshetra_id;
            }
        } elseif (!empty($profileData['nagar_id'])) {
            $nagar = Nagar::with('jila.vibhag.prant.kshetra')->find($profileData['nagar_id']);
            if ($nagar) {
                $profileData['jila_id'] = $nagar->jila_id;
                $profileData['vibhag_id'] = $nagar->jila?->vibhag_id;
                $profileData['prant_id'] = $nagar->jila?->vibhag?->prant_id;
                $profileData['kshetra_id'] = $nagar->jila?->vibhag?->prant?->kshetra_id;
            }
        } elseif (!empty($profileData['jila_id'])) {
            $jila = Jila::with('vibhag.prant.kshetra')->find($profileData['jila_id']);
            if ($jila) {
                $profileData['vibhag_id'] = $jila->vibhag_id;
                $profileData['prant_id'] = $jila->vibhag?->prant_id;
                $profileData['kshetra_id'] = $jila->vibhag?->prant?->kshetra_id;
            }
        } elseif (!empty($profileData['vibhag_id'])) {
            $vibhag = Vibhag::with('prant.kshetra')->find($profileData['vibhag_id']);
            if ($vibhag) {
                $profileData['prant_id'] = $vibhag->prant_id;
                $profileData['kshetra_id'] = $vibhag->prant?->kshetra_id;
            }
        } elseif (!empty($profileData['prant_id'])) {
            $prant = Prant::find($profileData['prant_id']);
            if ($prant) {
                $profileData['kshetra_id'] = $prant->kshetra_id;
            }
        }

        UserProfile::create($profileData);

        Auth::login($user);

        if ($user->role === 'karyakarta') {
            return redirect()->route('karyakarta.dashboard')->with('success', 'Karyakarta account created successfully! Welcome to the Karyakarta Panel.');
        }

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
