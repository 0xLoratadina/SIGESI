<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('tickets', 'canal')) {
            DB::statement('DROP INDEX IF EXISTS tickets_canal_index');

            Schema::table('tickets', function (Blueprint $table) {
                $table->dropColumn('canal');
            });
        }
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->string('canal')->default('Web')->after('ubicacion_id');
            $table->index('canal');
        });
    }
};
