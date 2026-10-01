<?php

namespace App\Services;

use App\Models\Jila;
use App\Models\Kshetra;
use App\Models\Nagar;
use App\Models\Prant;
use App\Models\Shakha;
use App\Models\User;
use App\Models\Vibhag;
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

    /**
     * Encrypt an organizational unit integer ID into a short, URL-safe token.
     * Uses AES-128-ECB for ultra-fast, deterministic single-block reversible obfuscation.
     */
    public static function encryptId(int|string $id): string
    {
        $numericId = (int) $id;
        $key = substr(self::getKey(), 0, 16);
        $plaintext = 'toli:' . $numericId;
        $ciphertext = openssl_encrypt($plaintext, 'aes-128-ecb', $key, OPENSSL_RAW_DATA);
        return rtrim(strtr(base64_encode($ciphertext), '+/', '-_'), '=');
    }

    /**
     * Decrypt a URL-safe token back to an integer ID.
     * Returns null if token is invalid, corrupted, or tampered with.
     */
    public static function decryptId(mixed $token): ?int
    {
        if (!is_string($token) || empty($token)) {
            return null;
        }

        try {
            $key = substr(self::getKey(), 0, 16);
            $raw = base64_decode(strtr($token, '-_', '+/'));
            if ($raw === false || strlen($raw) < 16) {
                return null;
            }

            $decrypted = openssl_decrypt($raw, 'aes-128-ecb', $key, OPENSSL_RAW_DATA);
            if ($decrypted === false || !str_starts_with($decrypted, 'toli:')) {
                return null;
            }

            $val = substr($decrypted, 5);
            return ctype_digit($val) ? (int) $val : null;
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Build an encrypted Toli hierarchy URL.
     * E.g. /{kshetra_enc}/{vibhag_enc}/{jila_enc}/{nagar_enc}/{shakha_enc}
     */
    public static function buildToliUrl(
        int|string $kshetraId,
        int|string|null $vibhagId = null,
        int|string|null $jilaId = null,
        int|string|null $nagarId = null,
        int|string|null $shakhaId = null
    ): string {
        $segments = [];

        if ($kshetraId) {
            $segments[] = self::encryptId($kshetraId);
        }
        if ($vibhagId) {
            $segments[] = self::encryptId($vibhagId);
        }
        if ($jilaId) {
            $segments[] = self::encryptId($jilaId);
        }
        if ($nagarId) {
            $segments[] = self::encryptId($nagarId);
        }
        if ($shakhaId) {
            $segments[] = self::encryptId($shakhaId);
        }

        return '/' . implode('/', $segments);
    }

    /**
     * Resolve the full encrypted Toli URL for a given organizational unit scope and ID.
     */
    public static function getToliUrlForScope(string $level, int $id): ?string
    {
        switch ($level) {
            case 'shakha':
                $shakha = Shakha::with('nagar.jila.vibhag.prant')->find($id);
                if (!$shakha) {
                    return null;
                }
                $nagar = $shakha->nagar;
                $jila = $nagar?->jila;
                $vibhag = $jila?->vibhag;
                $kshetraId = $vibhag?->prant?->kshetra_id;
                if (!$kshetraId || !$vibhag || !$jila || !$nagar) {
                    return null;
                }
                return self::buildToliUrl($kshetraId, $vibhag->id, $jila->id, $nagar->id, $shakha->id);

            case 'nagar':
                $nagar = Nagar::with('jila.vibhag.prant')->find($id);
                if (!$nagar) {
                    return null;
                }
                $jila = $nagar->jila;
                $vibhag = $jila?->vibhag;
                $kshetraId = $vibhag?->prant?->kshetra_id;
                if (!$kshetraId || !$vibhag || !$jila) {
                    return null;
                }
                return self::buildToliUrl($kshetraId, $vibhag->id, $jila->id, $nagar->id);

            case 'jila':
                $jila = Jila::with('vibhag.prant')->find($id);
                if (!$jila) {
                    return null;
                }
                $vibhag = $jila->vibhag;
                $kshetraId = $vibhag?->prant?->kshetra_id;
                if (!$kshetraId || !$vibhag) {
                    return null;
                }
                return self::buildToliUrl($kshetraId, $vibhag->id, $jila->id);

            case 'vibhag':
                $vibhag = Vibhag::with('prant')->find($id);
                if (!$vibhag) {
                    return null;
                }
                $kshetraId = $vibhag->prant?->kshetra_id;
                if (!$kshetraId) {
                    return null;
                }
                return self::buildToliUrl($kshetraId, $vibhag->id);

            case 'prant':
                $prant = Prant::find($id);
                if (!$prant || !$prant->kshetra_id) {
                    return null;
                }
                return self::buildToliUrl($prant->kshetra_id);

            case 'kshetra':
                $kshetra = Kshetra::find($id);
                if (!$kshetra) {
                    return null;
                }
                return self::buildToliUrl($kshetra->id);

            default:
                return null;
        }
    }
}
