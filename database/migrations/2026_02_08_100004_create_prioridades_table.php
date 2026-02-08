<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prioridades', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 50);
            $table->string('color', 7);
            $table->unsignedInteger('horas_respuesta');
            $table->unsignedInteger('horas_resolucion');
            $table->unsignedTinyInteger('nivel')->unique();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prioridades');
    }
};
