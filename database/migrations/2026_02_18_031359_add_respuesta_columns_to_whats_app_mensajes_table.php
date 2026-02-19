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
        Schema::table('whats_app_mensajes', function (Blueprint $table) {
            $table->string('respuesta_a_id')->nullable()->after('es_bot');
            $table->text('respuesta_a_contenido')->nullable()->after('respuesta_a_id');
            $table->string('respuesta_a_tipo')->nullable()->after('respuesta_a_contenido');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('whats_app_mensajes', function (Blueprint $table) {
            $table->dropColumn(['respuesta_a_id', 'respuesta_a_contenido', 'respuesta_a_tipo']);
        });
    }
};
