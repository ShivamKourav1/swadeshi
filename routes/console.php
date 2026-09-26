<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('superadmin:reset-password {email? : Superadmin email or phone} {password? : New password}', function () {
    $emailArg = $this->argument('email');
    $passwordArg = $this->argument('password');

    $superadmins = \App\Models\User::where('role', 'superadmin')->get();

    if ($superadmins->isEmpty()) {
        $this->warn('No user with primary role "superadmin" found.');
        $fallback = \App\Models\User::where('role', 'admin')->orWhere('email', 'like', '%admin%')->get();
        if ($fallback->isNotEmpty()) {
            $this->info('Found administrator accounts:');
            $this->table(['ID', 'Name', 'Email', 'Phone', 'Role', 'Status'], $fallback->map(fn($u) => [$u->id, $u->name, $u->email, $u->phone, $u->role, $u->status]));
        }
    } else {
        $this->info('Existing Superadmin accounts:');
        $this->table(['ID', 'Name', 'Email', 'Phone', 'Role', 'Status'], $superadmins->map(fn($u) => [$u->id, $u->name, $u->email, $u->phone, $u->role, $u->status]));
    }

    $targetInput = $emailArg ?: $this->ask('Enter the Email or Mobile number of the superadmin account', $superadmins->first()?->email ?: 'admin@ecommerce.com');

    $user = \App\Models\User::where('email', $targetInput)
        ->orWhere('phone', $targetInput)
        ->orWhere('id', is_numeric($targetInput) ? (int)$targetInput : 0)
        ->first();

    if (!$user) {
        if ($this->confirm("User [{$targetInput}] does not exist. Do you want to create a new Superadmin with this email?", true)) {
            $name = $this->ask('Enter Superadmin Name', 'System Admin');
            $phone = $this->ask('Enter Phone (Optional)', null);
            $newPassword = $passwordArg ?: $this->secret('Enter New Password') ?: 'Admin@12345';

            $user = \App\Models\User::create([
                'name' => $name,
                'email' => str_contains($targetInput, '@') ? $targetInput : 'admin@ecommerce.com',
                'phone' => !str_contains($targetInput, '@') ? $targetInput : $phone,
                'password' => \Illuminate\Support\Facades\Hash::make($newPassword),
                'role' => 'superadmin',
                'status' => 'active',
            ]);

            \App\Models\UserProfile::firstOrCreate(['user_id' => $user->id]);

            $superadminRole = \App\Models\Role::where('name', 'superadmin')->first();
            if ($superadminRole) {
                $user->roles()->syncWithoutDetaching([$superadminRole->id]);
            }

            $this->info('----------------------------------------------------');
            $this->info('  SUPERADMIN ACCOUNT SUCCESSFULLY CREATED!          ');
            $this->info('----------------------------------------------------');
            $this->info("Name:     {$user->name}");
            $this->info("Email:    {$user->email}");
            $this->info("Phone:    {$user->phone}");
            $this->info("Role:     {$user->role}");
            $this->info("Password: {$newPassword}");
            $this->info('----------------------------------------------------');
            return 0;
        }

        $this->error("Account [{$targetInput}] not found. Aborting.");
        return 1;
    }

    $newPassword = $passwordArg ?: ($this->secret('Enter New Password (press Enter for default: Admin@12345)') ?: 'Admin@12345');

    $user->password = \Illuminate\Support\Facades\Hash::make($newPassword);
    $user->role = 'superadmin';
    $user->status = 'active';
    $user->save();

    // Ensure superadmin role in pivot
    $superadminRole = \App\Models\Role::where('name', 'superadmin')->first();
    if ($superadminRole) {
        $user->roles()->syncWithoutDetaching([$superadminRole->id]);
    }

    $this->info('----------------------------------------------------');
    $this->info('  SUPERADMIN PASSWORD SUCCESSFULLY RESET!          ');
    $this->info('----------------------------------------------------');
    $this->info("Name:     {$user->name}");
    $this->info("Email:    {$user->email}");
    $this->info("Phone:    {$user->phone}");
    $this->info("Role:     {$user->role}");
    $this->info("Password: {$newPassword}");
    $this->info("Status:   {$user->status}");
    $this->info('----------------------------------------------------');

    return 0;
})->purpose('Reset superadmin password or create a new superadmin on staging/production');

