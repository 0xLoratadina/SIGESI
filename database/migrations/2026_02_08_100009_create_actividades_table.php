<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('actividades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->foreignId('usuario_id')->constrained('users')->restrictOnDelete();
            $table->string('tipo');
            $table->string('descripcion');
            $table->string('valor_anterior')->nullable();
            $table->string('valor_nuevo')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index('tipo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('actividades');
    }
};
