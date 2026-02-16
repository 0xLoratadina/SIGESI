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
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('debe_cambiar_password')->default(false)->after('max_tickets');
            $table->boolean('onboarding_completado')->default(false)->after('debe_cambiar_password');
            $table->timestamp('fecha_onboarding')->nullable()->after('onboarding_completado');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['debe_cambiar_password', 'onboarding_completado', 'fecha_onboarding']);
        });
    }
};
