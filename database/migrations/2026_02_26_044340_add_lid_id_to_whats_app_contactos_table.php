<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('whats_app_contactos', function (Blueprint $table) {
            $table->string('lid_id')->nullable()->unique()->after('whatsapp_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('whats_app_contactos', function (Blueprint $table) {
            $table->dropColumn('lid_id');
        });
    }
};
