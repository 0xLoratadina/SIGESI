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
        Schema::create('whats_app_contactos', function (Blueprint $table) {
            $table->id();
            $table->string('whatsapp_id')->unique();
            $table->string('telefono');
            $table->string('nombre');
            $table->string('avatar')->nullable();
            $table->boolean('en_linea')->default(false);
            $table->timestamp('ultima_conexion')->nullable();
            $table->enum('estado_ticket', ['sin_ticket', 'pendiente', 'en_proceso', 'cerrado'])->default('sin_ticket');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('whats_app_contactos');
    }
};
