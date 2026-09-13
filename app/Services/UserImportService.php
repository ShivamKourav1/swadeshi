<?php

namespace App\Services;

use App\Models\Role;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use SimpleXMLElement;
use ZipArchive;

class UserImportService
{
    /**
     * Generate template CSV content with UTF-8 BOM for flawless Excel rendering.
     */
    public static function generateTemplateCsv(): string
    {
        $headers = [
            'Name',
            'Mobile',
            'Is Shakha Toli Member',
            'Is Nagar Toli Member',
            'Is Jila Toli Member',
        ];

        $sampleRows = [
            ['Ramesh Sharma (रमेश शर्मा)', '+91 9826011111', 'Yes', 'No', 'No'],
            ['Sunil Verma (सुनील वर्मा)', '+91 9826022222', 'No', 'Yes', 'No'],
            ['Amit Patel (अमित पटेल)', '+91 9826033333', 'No', 'No', 'Yes'],
            ['Karan Singh (करण सिंह)', '+91 9826044444', 'No', 'No', 'No'],
        ];

        $output = fopen('php://temp', 'r+');
        // UTF-8 BOM for Excel
        fputs($output, "\xEF\xBB\xBF");
        fputcsv($output, $headers);

        foreach ($sampleRows as $row) {
            fputcsv($output, $row);
        }

        rewind($output);
        $csvContent = stream_get_contents($output);
        fclose($output);

        return $csvContent;
    }

    /**
     * Import users from an uploaded CSV or XLSX file.
     */
    public function import(UploadedFile $file, ?User $importingAdmin = null): array
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $rows = [];

        if ($extension === 'xlsx') {
            $rows = $this->parseXlsx($file->getPathname());
        } else {
            $rows = $this->parseCsv($file->getPathname());
        }

        if (empty($rows)) {
            return [
                'success' => false,
                'message' => 'The uploaded file is empty or could not be read.',
                'imported_count' => 0,
                'updated_count' => 0,
                'errors' => ['File contains no readable rows.'],
            ];
        }

        // Map Header Columns
        $headerRow = array_shift($rows);
        $headerMap = $this->mapHeaders($headerRow);

        if ($headerMap['name'] === null || $headerMap['mobile'] === null) {
            return [
                'success' => false,
                'message' => 'Template format invalid. "Name" and "Mobile" columns are required.',
                'imported_count' => 0,
                'updated_count' => 0,
                'errors' => ['Missing required columns "Name" and/or "Mobile".'],
            ];
        }

        $jilaRole = Role::firstOrCreate(['name' => 'jila_karyakarta'], ['display_name' => 'Jila Karyakarta (जिला कार्यकर्ता)']);
        $nagarRole = Role::firstOrCreate(['name' => 'nagar_karyakarta'], ['display_name' => 'Nagar Karyakarta (नगर कार्यकर्ता)']);
        $shakhaRole = Role::firstOrCreate(['name' => 'shakha_karyakarta'], ['display_name' => 'Shakha Karyakarta (शाखा कार्यकर्ता)']);
        $karyakartaRole = Role::firstOrCreate(['name' => 'karyakarta'], ['display_name' => 'Karyakarta (कार्यकर्ता)']);
        $customerRole = Role::firstOrCreate(['name' => 'customer'], ['display_name' => 'Customer (ग्राहक)']);

        $importedCount = 0;
        $updatedCount = 0;
        $errors = [];

        DB::beginTransaction();
        try {
            foreach ($rows as $index => $row) {
                $rowNum = $index + 2; // Accounting for 1-based index + header
                $name = trim($row[$headerMap['name']] ?? '');
                $mobile = trim($row[$headerMap['mobile']] ?? '');

                if (empty($name) && empty($mobile)) {
                    continue; // Skip blank lines
                }

                if (empty($name)) {
                    $errors[] = "Row {$rowNum}: Name is missing.";
                    continue;
                }

                if (empty($mobile)) {
                    $errors[] = "Row {$rowNum}: Mobile number is missing.";
                    continue;
                }

                // Clean and normalize phone number
                $cleanPhone = preg_replace('/[^\d+]/', '', $mobile);
                if (strlen(preg_replace('/[^\d]/', '', $cleanPhone)) < 10) {
                    $errors[] = "Row {$rowNum} ('{$name}'): Mobile number '{$mobile}' is too short.";
                    continue;
                }

                // Determine Toli memberships
                $isShakha = $this->isAffirmative($row[$headerMap['is_shakha']] ?? '');
                $isNagar = $this->isAffirmative($row[$headerMap['is_nagar']] ?? '');
                $isJila = $this->isAffirmative($row[$headerMap['is_jila']] ?? '');

                $assignedRoleIds = [];
                $primaryRole = 'customer';

                if ($isJila && $jilaRole) {
                    $assignedRoleIds[] = $jilaRole->id;
                    $primaryRole = 'karyakarta';
                }
                if ($isNagar && $nagarRole) {
                    $assignedRoleIds[] = $nagarRole->id;
                    $primaryRole = 'karyakarta';
                }
                if ($isShakha && $shakhaRole) {
                    $assignedRoleIds[] = $shakhaRole->id;
                    $primaryRole = 'karyakarta';
                }

                if (!empty($assignedRoleIds)) {
                    if ($karyakartaRole && !in_array($karyakartaRole->id, $assignedRoleIds)) {
                        $assignedRoleIds[] = $karyakartaRole->id;
                    }
                } else {
                    if ($customerRole) {
                        $assignedRoleIds[] = $customerRole->id;
                    }
                }

                // Prepare profile payload with toli flags and admin jurisdiction
                $profilePayload = [
                    'is_shakha_toli_member' => $isShakha,
                    'is_nagar_toli_member' => $isNagar,
                    'is_jila_toli_member' => $isJila,
                ];

                if ($importingAdmin && $importingAdmin->isToliAdmin()) {
                    $adminProfile = $importingAdmin->profile;
                    if ($adminProfile) {
                        if ($adminProfile->kshetra_id) $profilePayload['kshetra_id'] = $adminProfile->kshetra_id;
                        if ($adminProfile->prant_id) $profilePayload['prant_id'] = $adminProfile->prant_id;
                        if ($adminProfile->vibhag_id) $profilePayload['vibhag_id'] = $adminProfile->vibhag_id;
                        if ($adminProfile->jila_id) $profilePayload['jila_id'] = $adminProfile->jila_id;
                        if ($adminProfile->nagar_id) $profilePayload['nagar_id'] = $adminProfile->nagar_id;
                        if ($adminProfile->shakha_id) $profilePayload['shakha_id'] = $adminProfile->shakha_id;
                    }
                }

                // Look for existing user by phone
                $user = User::where('phone', $cleanPhone)
                    ->orWhere('phone', $mobile)
                    ->first();

                if ($user) {
                    // Update existing user roles and name
                    $user->update([
                        'name' => $name,
                        'role' => $primaryRole,
                        'status' => 'active',
                    ]);
                    $user->roles()->sync($assignedRoleIds);

                    if ($user->profile) {
                        $user->profile->update($profilePayload);
                    } else {
                        $profilePayload['user_id'] = $user->id;
                        $user->profile()->create($profilePayload);
                    }
                    $updatedCount++;
                } else {
                    // Create new user with password set to mobile number
                    $user = User::create([
                        'name' => $name,
                        'email' => null,
                        'phone' => $cleanPhone,
                        'password' => Hash::make($cleanPhone), // Password is the mobile number
                        'role' => $primaryRole,
                        'status' => 'active',
                    ]);

                    $profilePayload['user_id'] = $user->id;
                    UserProfile::create($profilePayload);

                    $user->roles()->sync($assignedRoleIds);
                    $importedCount++;
                }
            }

            DB::commit();

            return [
                'success' => true,
                'imported_count' => $importedCount,
                'updated_count' => $updatedCount,
                'errors' => $errors,
                'message' => "Successfully imported {$importedCount} new user(s) and updated {$updatedCount} existing user(s). Default passwords are set to their mobile numbers.",
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            return [
                'success' => false,
                'message' => 'Import failed due to error: ' . $e->getMessage(),
                'imported_count' => 0,
                'updated_count' => 0,
                'errors' => [$e->getMessage()],
            ];
        }
    }

    /**
     * Map row headers by fuzzy matching standard column names.
     */
    private function mapHeaders(array $headers): array
    {
        $map = [
            'name' => null,
            'mobile' => null,
            'is_shakha' => null,
            'is_nagar' => null,
            'is_jila' => null,
        ];

        foreach ($headers as $index => $header) {
            $normalized = strtolower(trim((string)$header));
            $normalized = preg_replace('/[_\-\s]+/', ' ', $normalized);

            if (str_contains($normalized, 'name') || str_contains($normalized, 'नाम')) {
                if ($map['name'] === null) $map['name'] = $index;
            } elseif (str_contains($normalized, 'mobile') || str_contains($normalized, 'phone') || str_contains($normalized, 'मोबाइल')) {
                if ($map['mobile'] === null) $map['mobile'] = $index;
            } elseif (str_contains($normalized, 'shakha') || str_contains($normalized, 'शाखा')) {
                if ($map['is_shakha'] === null) $map['is_shakha'] = $index;
            } elseif (str_contains($normalized, 'nagar') || str_contains($normalized, 'नगर')) {
                if ($map['is_nagar'] === null) $map['is_nagar'] = $index;
            } elseif (str_contains($normalized, 'jila') || str_contains($normalized, 'जिला')) {
                if ($map['is_jila'] === null) $map['is_jila'] = $index;
            }
        }

        return $map;
    }

    /**
     * Check if a value represents an affirmative response.
     */
    private function isAffirmative($value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        $val = strtolower(trim((string)$value));
        return in_array($val, ['yes', 'y', '1', 'true', 't', 'हाँ', 'हा', 'haa', 'ha']);
    }

    /**
     * Parse CSV file with comma or semicolon delimiter and UTF-8 encoding.
     */
    private function parseCsv(string $filePath): array
    {
        $rows = [];
        if (($handle = fopen($filePath, 'r')) !== false) {
            // Check and skip BOM if present
            $bom = fread($handle, 3);
            if ($bom !== "\xEF\xBB\xBF") {
                rewind($handle);
            }

            // Detect separator
            $firstLine = fgets($handle);
            rewind($handle);
            if ($bom === "\xEF\xBB\xBF") {
                fread($handle, 3);
            }
            $delimiter = (substr_count($firstLine, ';') > substr_count($firstLine, ',')) ? ';' : ',';

            while (($data = fgetcsv($handle, 0, $delimiter)) !== false) {
                $rows[] = array_map('trim', $data);
            }
            fclose($handle);
        }

        return $rows;
    }

    /**
     * Parse XLSX file natively using ZipArchive and SimpleXML without external packages.
     */
    private function parseXlsx(string $filePath): array
    {
        $zip = new ZipArchive();
        if ($zip->open($filePath) !== true) {
            return [];
        }

        // 1. Read Shared Strings table
        $sharedStrings = [];
        $sharedXmlContent = $zip->getFromName('xl/sharedStrings.xml');
        if ($sharedXmlContent !== false) {
            $xml = new SimpleXMLElement($sharedXmlContent);
            foreach ($xml->si as $si) {
                $text = '';
                if (isset($si->t)) {
                    $text = (string)$si->t;
                } elseif (isset($si->r)) {
                    foreach ($si->r as $r) {
                        $text .= (string)$r->t;
                    }
                }
                $sharedStrings[] = $text;
            }
        }

        // 2. Read first worksheet sheet1.xml
        $sheetXmlContent = $zip->getFromName('xl/worksheets/sheet1.xml');
        if ($sheetXmlContent === false) {
            $zip->close();
            return [];
        }

        $sheetXml = new SimpleXMLElement($sheetXmlContent);
        $rows = [];

        if (isset($sheetXml->sheetData->row)) {
            foreach ($sheetXml->sheetData->row as $row) {
                $rowCells = [];
                foreach ($row->c as $cell) {
                    $type = (string)$cell['t'];
                    $val = (string)$cell->v;

                    if ($type === 's' && isset($sharedStrings[(int)$val])) {
                        $cellValue = $sharedStrings[(int)$val];
                    } elseif ($type === 'inlineStr' && isset($cell->is->t)) {
                        $cellValue = (string)$cell->is->t;
                    } else {
                        $cellValue = $val;
                    }

                    // Extract column letter from cell reference e.g. A1, B1
                    $cellRef = (string)$cell['r'];
                    $colLetter = preg_replace('/[0-9]/', '', $cellRef);
                    $colIndex = $this->letterToColumnIndex($colLetter);

                    $rowCells[$colIndex] = trim($cellValue);
                }

                if (!empty($rowCells)) {
                    ksort($rowCells);
                    // Fill gaps with empty strings
                    $maxIndex = max(array_keys($rowCells));
                    $cleanRow = [];
                    for ($i = 0; $i <= $maxIndex; $i++) {
                        $cleanRow[$i] = $rowCells[$i] ?? '';
                    }
                    $rows[] = $cleanRow;
                }
            }
        }

        $zip->close();
        return $rows;
    }

    private function letterToColumnIndex(string $letters): int
    {
        $letters = strtoupper($letters);
        $num = 0;
        for ($i = 0; $i < strlen($letters); $i++) {
            $num = $num * 26 + (ord($letters[$i]) - ord('A') + 1);
        }
        return $num - 1;
    }
}
