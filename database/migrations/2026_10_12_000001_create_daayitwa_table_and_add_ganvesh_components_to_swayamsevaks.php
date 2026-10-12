<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create table 'daayitwa'
        if (!Schema::hasTable('daayitwa')) {
            Schema::create('daayitwa', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('unit_level'); // kshetra, vibhag, jila, nagar (or nager), basti, shakha, prant
                $table->timestamps();

                $table->index('unit_level');
            });
        }

        // 2. Add daayitwa_id and individual ganvesh component booleans to swayamsevaks
        if (Schema::hasTable('swayamsevaks')) {
            Schema::table('swayamsevaks', function (Blueprint $table) {
                if (!Schema::hasColumn('swayamsevaks', 'daayitwa_id')) {
                    $table->foreignId('daayitwa_id')->nullable()->after('address')->constrained('daayitwa')->nullOnDelete();
                }
                if (!Schema::hasColumn('swayamsevaks', 'have_pant')) {
                    $table->boolean('have_pant')->default(false)->after('ganvesh');
                }
                if (!Schema::hasColumn('swayamsevaks', 'have_shirt')) {
                    $table->boolean('have_shirt')->default(false)->after('have_pant');
                }
                if (!Schema::hasColumn('swayamsevaks', 'have_topi')) {
                    $table->boolean('have_topi')->default(false)->after('have_shirt');
                }
                if (!Schema::hasColumn('swayamsevaks', 'have_dand')) {
                    $table->boolean('have_dand')->default(false)->after('have_topi');
                }
                if (!Schema::hasColumn('swayamsevaks', 'have_belt')) {
                    $table->boolean('have_belt')->default(false)->after('have_dand');
                }
                if (!Schema::hasColumn('swayamsevaks', 'have_moje')) {
                    $table->boolean('have_moje')->default(false)->after('have_belt');
                }
                if (!Schema::hasColumn('swayamsevaks', 'have_shoes')) {
                    $table->boolean('have_shoes')->default(false)->after('have_moje');
                }
            });

            // If a swayamsevak already has full ganvesh, mark all individual components as true
            DB::table('swayamsevaks')->where('ganvesh', true)->update([
                'have_pant' => true,
                'have_shirt' => true,
                'have_topi' => true,
                'have_dand' => true,
                'have_belt' => true,
                'have_moje' => true,
                'have_shoes' => true,
            ]);
        }

        // 3. Populate default RSS organizational daayitwas
        $initialDaayitwas = [
            // Shakha
            ['name' => 'मुख्य शिक्षक', 'unit_level' => 'shakha'],
            ['name' => 'कार्यवाह', 'unit_level' => 'shakha'],
            ['name' => 'पालक', 'unit_level' => 'shakha'],
            ['name' => 'शारीरिक प्रमुख', 'unit_level' => 'shakha'],
            ['name' => 'बौद्धिक प्रमुख', 'unit_level' => 'shakha'],
            ['name' => 'व्यवस्था प्रमुख', 'unit_level' => 'shakha'],
            // Basti
            ['name' => 'बस्ती प्रमुख', 'unit_level' => 'basti'],
            ['name' => 'बस्ती कार्यवाह', 'unit_level' => 'basti'],
            ['name' => 'बस्ती पालक', 'unit_level' => 'basti'],
            ['name' => 'बस्ती शारीरिक प्रमुख', 'unit_level' => 'basti'],
            ['name' => 'बस्ती बौद्धिक प्रमुख', 'unit_level' => 'basti'],
            // Nagar
            ['name' => 'नगर संघचालक', 'unit_level' => 'nagar'],
            ['name' => 'नगर कार्यवाह', 'unit_level' => 'nagar'],
            ['name' => 'नगर प्रचारक', 'unit_level' => 'nagar'],
            ['name' => 'नगर शारीरिक प्रमुख', 'unit_level' => 'nagar'],
            ['name' => 'नगर बौद्धिक प्रमुख', 'unit_level' => 'nagar'],
            ['name' => 'नगर व्यवस्था प्रमुख', 'unit_level' => 'nagar'],
            // Jila
            ['name' => 'जिला संघचालक', 'unit_level' => 'jila'],
            ['name' => 'जिला कार्यवाह', 'unit_level' => 'jila'],
            ['name' => 'जिला प्रचारक', 'unit_level' => 'jila'],
            ['name' => 'जिला शारीरिक प्रमुख', 'unit_level' => 'jila'],
            ['name' => 'जिला बौद्धिक प्रमुख', 'unit_level' => 'jila'],
            ['name' => 'जिला व्यवस्था प्रमुख', 'unit_level' => 'jila'],
            // Vibhag
            ['name' => 'विभाग संघचालक', 'unit_level' => 'vibhag'],
            ['name' => 'विभाग कार्यवाह', 'unit_level' => 'vibhag'],
            ['name' => 'विभाग प्रचारक', 'unit_level' => 'vibhag'],
            // Prant
            ['name' => 'प्रान्त संघचालक', 'unit_level' => 'prant'],
            ['name' => 'प्रान्त कार्यवाह', 'unit_level' => 'prant'],
            ['name' => 'प्रान्त प्रचारक', 'unit_level' => 'prant'],
            // Kshetra
            ['name' => 'क्षेत्र संघचालक', 'unit_level' => 'kshetra'],
            ['name' => 'क्षेत्र कार्यवाह', 'unit_level' => 'kshetra'],
            ['name' => 'क्षेत्र प्रचारक', 'unit_level' => 'kshetra'],
        ];

        foreach ($initialDaayitwas as $d) {
            DB::table('daayitwa')->updateOrInsert(
                ['name' => $d['name'], 'unit_level' => $d['unit_level']],
                ['created_at' => now(), 'updated_at' => now()]
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('swayamsevaks')) {
            Schema::table('swayamsevaks', function (Blueprint $table) {
                if (Schema::hasColumn('swayamsevaks', 'daayitwa_id')) {
                    $table->dropConstrainedForeignId('daayitwa_id');
                }
                $table->dropColumn([
                    'have_pant',
                    'have_shirt',
                    'have_topi',
                    'have_dand',
                    'have_belt',
                    'have_moje',
                    'have_shoes',
                ]);
            });
        }

        Schema::dropIfExists('daayitwa');
    }
};
