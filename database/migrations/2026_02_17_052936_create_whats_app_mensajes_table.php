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
        Schema::create('whats_app_mensajes', function (Blueprint $table) {
            $table->id();
            $table->string('whatsapp_id')->unique();
            $table->foreignId('contacto_id')->constrained('whats_app_contactos')->cascadeOnDelete();
            $table->enum('tipo', ['recibido', 'enviado']);
            $table->text('contenido');
            $table->boolean('leido')->default(false);
            $table->boolean('es_bot')->default(false);
            $table->string('media_url')->nullable();
            $table->string('media_tipo')->nullable();
            $table->timestamp('enviado_at');
            $table->timestamps();

            $table->index(['contacto_id', 'enviado_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('whats_app_mensajes');
    }
};
