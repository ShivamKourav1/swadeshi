<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Rename or drop legacy shakha foreign key constraint from before the basti rename
     * so that adding the new decoupled shakha_id foreign key doesn't trigger a duplicate
     * constraint name error in PostgreSQL or MySQL.
     */
    private function releaseOldShakhaConstraint(string $tableName): void
    {
        $driver = DB::getDriverName();
        $oldConstraint = "{$tableName}_shakha_id_foreign";
        $newConstraint = "{$tableName}_basti_id_foreign";

        if ($driver === 'pgsql') {
            DB::statement("
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.table_constraints 
                        WHERE constraint_name = '{$oldConstraint}' 
                        AND table_name = '{$tableName}'
                    ) THEN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.table_constraints 
                            WHERE constraint_name = '{$newConstraint}' 
                            AND table_name = '{$tableName}'
                        ) THEN
                            ALTER TABLE \"{$tableName}\" RENAME CONSTRAINT \"{$oldConstraint}\" TO \"{$newConstraint}\";
                        ELSE
                            ALTER TABLE \"{$tableName}\" DROP CONSTRAINT \"{$oldConstraint}\";
                        END IF;
                    END IF;
                END $$;
            ");
        } elseif ($driver === 'mysql') {
            try {
                DB::statement("ALTER TABLE `{$tableName}` DROP FOREIGN KEY `{$oldConstraint}`");
            } catch (\Throwable $e) {
                // Ignore if constraint does not exist
            }
        }
    }
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Remove shakha-specific columns from bastis table so it only keeps:
        //    'id', 'nagar_id', 'basti_name', 'toli', 'status', 'created_at', 'updated_at'
        if (Schema::hasTable('bastis')) {
            Schema::table('bastis', function (Blueprint $table) {
                $columnsToDrop = [];
                if (Schema::hasColumn('bastis', 'aayu_varg')) {
                    $columnsToDrop[] = 'aayu_varg';
                }
                if (Schema::hasColumn('bastis', 'type')) {
                    $columnsToDrop[] = 'type';
                }
                if (Schema::hasColumn('bastis', 'new_ganvesh')) {
                    $columnsToDrop[] = 'new_ganvesh';
                }
                if (!empty($columnsToDrop)) {
                    $table->dropColumn($columnsToDrop);
                }
            });
        }

        // 2. Create decoupled shakhas table
        if (!Schema::hasTable('shakhas')) {
            Schema::create('shakhas', function (Blueprint $table) {
                $table->id();
                $table->string('shakha_name');
                $table->string('aayu_varg')->nullable();
                $table->string('type')->nullable();
                $table->integer('new_ganvesh')->default(0);
                $table->json('toli')->nullable();
                $table->enum('status', ['Active', 'Inactive'])->default('Active');
                $table->foreignId('jila_id')->nullable()->constrained('jilas')->nullOnDelete();
                $table->foreignId('nagar_id')->nullable()->constrained('nagars')->nullOnDelete();
                $table->foreignId('basti_id')->nullable()->constrained('bastis')->nullOnDelete();
                $table->timestamps();

                $table->index('jila_id');
                $table->index('nagar_id');
                $table->index('basti_id');
                $table->index('status');
            });
        }

        // 3. Ensure both shakha_id and basti_id are present and nullable in swayamsevaks table
        if (Schema::hasTable('swayamsevaks')) {
            $this->releaseOldShakhaConstraint('swayamsevaks');
            Schema::table('swayamsevaks', function (Blueprint $table) {
                if (Schema::hasColumn('swayamsevaks', 'basti_id')) {
                    $table->unsignedBigInteger('basti_id')->nullable()->change();
                }
                if (!Schema::hasColumn('swayamsevaks', 'shakha_id')) {
                    $table->foreignId('shakha_id')->nullable()->after('address')->constrained('shakhas')->nullOnDelete();
                }
            });
        }

        // 4. Ensure shakha_id is present and nullable in user_profiles, delivery_locations, and orders
        if (Schema::hasTable('user_profiles')) {
            $this->releaseOldShakhaConstraint('user_profiles');
            Schema::table('user_profiles', function (Blueprint $table) {
                if (!Schema::hasColumn('user_profiles', 'shakha_id')) {
                    $table->foreignId('shakha_id')->nullable()->after('basti_id')->constrained('shakhas')->nullOnDelete();
                }
            });
        }

        if (Schema::hasTable('delivery_locations')) {
            $this->releaseOldShakhaConstraint('delivery_locations');
            Schema::table('delivery_locations', function (Blueprint $table) {
                if (!Schema::hasColumn('delivery_locations', 'shakha_id')) {
                    $table->foreignId('shakha_id')->nullable()->after('basti_id')->constrained('shakhas')->nullOnDelete();
                }
            });
        }

        if (Schema::hasTable('orders')) {
            $this->releaseOldShakhaConstraint('orders');
            Schema::table('orders', function (Blueprint $table) {
                if (!Schema::hasColumn('orders', 'shakha_id')) {
                    $table->foreignId('shakha_id')->nullable()->after('basti_id')->constrained('shakhas')->nullOnDelete();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('orders') && Schema::hasColumn('orders', 'shakha_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropConstrainedForeignId('shakha_id');
            });
        }

        if (Schema::hasTable('delivery_locations') && Schema::hasColumn('delivery_locations', 'shakha_id')) {
            Schema::table('delivery_locations', function (Blueprint $table) {
                $table->dropConstrainedForeignId('shakha_id');
            });
        }

        if (Schema::hasTable('user_profiles') && Schema::hasColumn('user_profiles', 'shakha_id')) {
            Schema::table('user_profiles', function (Blueprint $table) {
                $table->dropConstrainedForeignId('shakha_id');
            });
        }

        if (Schema::hasTable('swayamsevaks') && Schema::hasColumn('swayamsevaks', 'shakha_id')) {
            Schema::table('swayamsevaks', function (Blueprint $table) {
                $table->dropConstrainedForeignId('shakha_id');
            });
        }

        if (Schema::hasTable('shakhas')) {
            Schema::dropIfExists('shakhas');
        }

        if (Schema::hasTable('bastis')) {
            Schema::table('bastis', function (Blueprint $table) {
                if (!Schema::hasColumn('bastis', 'aayu_varg')) {
                    $table->string('aayu_varg')->nullable();
                }
                if (!Schema::hasColumn('bastis', 'type')) {
                    $table->string('type')->nullable();
                }
                if (!Schema::hasColumn('bastis', 'new_ganvesh')) {
                    $table->integer('new_ganvesh')->default(0);
                }
            });
        }
    }
};
