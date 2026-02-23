<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->string('numero', 20)->unique();
            $table->string('titulo');
            $table->text('descripcion');
            $table->foreignId('solicitante_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('creador_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('departamento_id')->constrained('departamentos')->restrictOnDelete();
            $table->foreignId('categoria_id')->constrained('categorias')->restrictOnDelete();
            $table->foreignId('prioridad_id')->constrained('prioridades')->restrictOnDelete();
            $table->foreignId('ubicacion_id')->nullable()->constrained('ubicaciones')->nullOnDelete();
            $table->string('estado')->default('Abierto');
            $table->foreignId('tecnico_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('asignado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('fecha_asignacion')->nullable();
            $table->timestamp('fecha_resolucion')->nullable();
            $table->timestamp('fecha_cierre')->nullable();
            $table->text('solucion')->nullable();
            $table->unsignedTinyInteger('calificacion')->nullable();
            $table->text('comentario_cal')->nullable();
            $table->timestamp('fecha_limite')->nullable();
            $table->timestamps();

            $table->index('estado');
            $table->index('fecha_limite');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
