<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ToliEncryptionService
{
    /**
     * Get 32-byte binary key for AES-256-CBC.
     */
    protected static function getKey(): string
    {
        $rawKey = config('app.toli_encryption_key') ?: env('TOLI_ENCRYPTION_KEY') ?: config('app.key');

        if (Str::startsWith($rawKey, 'base64:')) {
            $key = base64_decode(substr($rawKey, 7));
        } else {
            $key = (string)$rawKey;
        }

        // Ensure key is exactly 32 bytes for AES-256
        return substr(hash('sha256', $key, true), 0, 32);
    }

    /**
     * Encrypt user credentials using universal symmetric key.
     */
    public static function encrypt(int $userId, string $plainPassword): string
    {
        $key = self::getKey();
        $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length('aes-256-cbc'));
        $data = json_encode([
            'uid' => $userId,
            'pwd' => $plainPassword,
            'iat' => time(),
        ]);

        $ciphertext = openssl_encrypt($data, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);

        // Package IV + ciphertext together and base64url encode
        return rtrim(strtr(base64_encode($iv . $ciphertext), '+/', '-_'), '=');
    }

    /**
     * Decrypt and verify credentials, then log the user in.
     */
    public static function decryptAndAuthenticate(string $token): ?User
    {
        try {
            $key = self::getKey();
            $raw = base64_decode(strtr($token, '-_', '+/'));
            $ivLen = openssl_cipher_iv_length('aes-256-cbc');

            if (strlen($raw) <= $ivLen) {
                return null;
            }

            $iv = substr($raw, 0, $ivLen);
            $ciphertext = substr($raw, $ivLen);

            $decrypted = openssl_decrypt($ciphertext, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);
            if ($decrypted === false) {
                return null;
            }

            $payload = json_decode($decrypted, true);
            if (!isset($payload['uid'], $payload['pwd'])) {
                return null;
            }

            $user = User::find($payload['uid']);
            if (!$user) {
                return null;
            }

            // Verify password against current user hash
            if (!Hash::check($payload['pwd'], $user->password)) {
                return null;
            }

            // Check if user is active
            if ($user->status !== 'active') {
                return null;
            }

            // Log user in
            Auth::login($user, true);

            return $user;
        } catch (\Throwable $e) {
            return null;
        }
    }
}
