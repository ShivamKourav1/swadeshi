<?php

use App\Http\Controllers\Admin\RoleController as AdminRoleController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\DealerCategoryController;
use App\Http\Controllers\DealerOrderController;
use App\Http\Controllers\DeliveryLocationController;
use App\Http\Controllers\DeliveryPartnerController;
use App\Http\Controllers\Karyakarta\KaryakartaDashboardController;
use App\Http\Controllers\Karyakarta\OrganizationUnitController;
use App\Http\Controllers\LanguageController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use Illuminate\Support\Facades\Route;

// Public Language Switcher Route
Route::post('/language/{locale}', [LanguageController::class, 'switchLanguage'])->name('language.switch');

// Public Storefront & Product Routes
Route::get('/', [ProductController::class, 'index'])->name('products.index');
Route::get('/products/{product}', [ProductController::class, 'show'])->name('products.show');

// Guest Auth Routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [AuthController::class, 'register']);
});

// Authenticated Routes
Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    // Cart Routes
    Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
    Route::post('/cart/add/{product}', [CartController::class, 'add'])->name('cart.add');
    Route::put('/cart/update/{product}', [CartController::class, 'update'])->name('cart.update');
    Route::delete('/cart/remove/{product}', [CartController::class, 'remove'])->name('cart.remove');
    Route::delete('/cart/clear', [CartController::class, 'clear'])->name('cart.clear');

    // Delivery Location (Address) Routes
    Route::get('/locations', [DeliveryLocationController::class, 'index'])->name('locations.index');
    Route::post('/locations', [DeliveryLocationController::class, 'store'])->name('locations.store');
    Route::put('/locations/{deliveryLocation}', [DeliveryLocationController::class, 'update'])->name('locations.update');
    Route::delete('/locations/{deliveryLocation}', [DeliveryLocationController::class, 'destroy'])->name('locations.destroy');

    // Customer Order Routes
    Route::get('/checkout', [OrderController::class, 'checkout'])->name('checkout.index');
    Route::post('/orders', [OrderController::class, 'store'])->name('orders.store');
    Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/{order}', [OrderController::class, 'show'])->name('orders.show');
    Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel'])->name('orders.cancel');
    Route::post('/orders/{order}/return-request', [\App\Http\Controllers\ReturnRequestController::class, 'store'])->name('orders.return_request.store');

    // Dealer Routes
    Route::prefix('dealer')->group(function () {
        Route::get('/products', [ProductController::class, 'dealerIndex'])->name('dealer.products.index');
        Route::get('/products/create', [ProductController::class, 'create'])->name('dealer.products.create');
        Route::post('/products', [ProductController::class, 'store'])->name('dealer.products.store');
        Route::get('/products/{product}/edit', [ProductController::class, 'edit'])->name('dealer.products.edit');
        Route::put('/products/{product}', [ProductController::class, 'update'])->name('dealer.products.update');
        Route::delete('/products/{product}', [ProductController::class, 'destroy'])->name('dealer.products.destroy');
        Route::get('/orders', [DealerOrderController::class, 'index'])->name('dealer.orders.index');
        Route::post('/orders/{order}/confirm-restock', [DealerOrderController::class, 'confirmRestock'])->name('dealer.orders.confirm_restock');
        
        // Return Request Handling
        Route::post('/return-requests/{returnRequest}/accept', [\App\Http\Controllers\ReturnRequestController::class, 'accept'])->name('dealer.return_requests.accept');
        Route::post('/return-requests/{returnRequest}/reject', [\App\Http\Controllers\ReturnRequestController::class, 'reject'])->name('dealer.return_requests.reject');
        Route::post('/return-requests/{returnRequest}/fulfill', [\App\Http\Controllers\ReturnRequestController::class, 'fulfill'])->name('dealer.return_requests.fulfill');

        // Category Management
        Route::get('/categories', [DealerCategoryController::class, 'index'])->name('dealer.categories.index');
        Route::post('/categories', [DealerCategoryController::class, 'store'])->name('dealer.categories.store');
        Route::put('/categories/{category}', [DealerCategoryController::class, 'update'])->name('dealer.categories.update');
        Route::delete('/categories/{category}', [DealerCategoryController::class, 'destroy'])->name('dealer.categories.destroy');
    });

    // Delivery Partner Routes
    Route::prefix('delivery')->group(function () {
        Route::get('/dashboard', [DeliveryPartnerController::class, 'index'])->name('delivery.index');
        Route::post('/claim/{order}', [DeliveryPartnerController::class, 'claimOrder'])->name('delivery.claim');
        Route::put('/status/{order}', [DeliveryPartnerController::class, 'updateStatus'])->name('delivery.status.update');
    });

    // Karyakarta (Organization Order Tracking & Analytics) Routes
    Route::prefix('karyakarta')->group(function () {
        Route::get('/dashboard', [KaryakartaDashboardController::class, 'index'])->name('karyakarta.dashboard');
        Route::get('/orders/{order}', [KaryakartaDashboardController::class, 'show'])->name('karyakarta.orders.show');
        
        // Organizational Units Management CRUD
        Route::get('/units', [OrganizationUnitController::class, 'index'])->name('karyakarta.units.index');
        Route::post('/units/{unitType}', [OrganizationUnitController::class, 'store'])->name('karyakarta.units.store');
        Route::put('/units/{unitType}/{id}', [OrganizationUnitController::class, 'update'])->name('karyakarta.units.update');
        Route::delete('/units/{unitType}/{id}', [OrganizationUnitController::class, 'destroy'])->name('karyakarta.units.destroy');
    });

    // Admin Routes
    Route::prefix('admin')->group(function () {
        // User Management
        Route::get('/users', [AdminUserController::class, 'index'])->name('admin.users.index');
        Route::get('/users/create', [AdminUserController::class, 'create'])->name('admin.users.create');
        Route::post('/users', [AdminUserController::class, 'store'])->name('admin.users.store');
        Route::get('/users/{user}/edit', [AdminUserController::class, 'edit'])->name('admin.users.edit');
        Route::put('/users/{user}', [AdminUserController::class, 'update'])->name('admin.users.update');
        Route::delete('/users/{user}', [AdminUserController::class, 'destroy'])->name('admin.users.destroy');
        Route::patch('/users/{user}/toggle-status', [AdminUserController::class, 'toggleStatus'])->name('admin.users.toggle');

        // Roles & Rights Management
        Route::get('/roles', [AdminRoleController::class, 'index'])->name('admin.roles.index');
        Route::post('/roles', [AdminRoleController::class, 'store'])->name('admin.roles.store');
        Route::put('/roles/{role}', [AdminRoleController::class, 'update'])->name('admin.roles.update');
        Route::delete('/roles/{role}', [AdminRoleController::class, 'destroy'])->name('admin.roles.destroy');
    });
});
