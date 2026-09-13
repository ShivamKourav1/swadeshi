<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return array_merge(parent::share($request), [
            'locale' => fn () => app()->getLocale(),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'is_admin' => $user->isAdmin(),
                    'is_superadmin' => $user->isSuperAdmin(),
                    'is_toli_admin' => $user->isToliAdmin(),
                    'belongs_to_toli' => $user->belongsToToli(),
                    'toli_jurisdiction' => $user->getToliJurisdiction(),
                    'is_karyakarta' => $user->isKaryakarta(),
                    'is_dealer' => $user->isDealer(),
                    'is_delivery_partner' => $user->isDeliveryPartner(),
                    'phone' => $user->phone,
                    'status' => $user->status,
                    'profile' => $user->profile,
                    'roles' => $user->relationLoaded('roles') ? $user->roles->pluck('name')->toArray() : $user->roles()->pluck('name')->toArray(),
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'cartCount' => function () use ($request) {
                $cart = $request->session()->get('cart', []);
                return array_sum(array_column($cart, 'quantity'));
            },
        ]);
    }
}
