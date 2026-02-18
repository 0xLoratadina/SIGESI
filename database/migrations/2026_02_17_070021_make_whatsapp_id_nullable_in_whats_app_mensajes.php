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
        // SQLite requiere recrear la tabla para cambiar constraints
        // Usamos PRAGMA para desactivar foreign keys temporalmente
        DB::statement('PRAGMA foreign_keys=off');

        // Eliminar índices existentes antes de renombrar
        DB::statement('DROP INDEX IF EXISTS whats_app_mensajes_contacto_id_enviado_at_index');
        DB::statement('DROP INDEX IF EXISTS whats_app_mensajes_whatsapp_id_unique');

        Schema::rename('whats_app_mensajes', 'whats_app_mensajes_old');

        Schema::create('whats_app_mensajes', function (Blueprint $table) {
            $table->id();
            $table->string('whatsapp_id')->nullable()->unique();
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

        // Copiar datos existentes
        DB::statement('INSERT INTO whats_app_mensajes SELECT * FROM whats_app_mensajes_old');

        Schema::dropIfExists('whats_app_mensajes_old');

        DB::statement('PRAGMA foreign_keys=on');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No es necesario revertir, la columna simplemente será nullable
    }
};
