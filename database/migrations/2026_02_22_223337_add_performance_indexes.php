<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->index('area_id');
            $table->index('activo');
        });

        Schema::table('tickets', function (Blueprint $table) {
            $table->index('solicitante_id');
            $table->index('creador_id');
            $table->index('auxiliar_id');
            $table->index('area_id');
            $table->index('categoria_id');
            $table->index('prioridad_id');
        });

        Schema::table('categorias', function (Blueprint $table) {
            $table->index('padre_id');
            $table->index('activo');
        });

        Schema::table('ubicaciones', function (Blueprint $table) {
            $table->index('area_id');
            $table->index('activo');
        });

        Schema::table('areas', function (Blueprint $table) {
            $table->index('activo');
        });

        Schema::table('prioridades', function (Blueprint $table) {
            $table->index('activo');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['area_id']);
            $table->dropIndex(['activo']);
        });

        Schema::table('tickets', function (Blueprint $table) {
            $table->dropIndex(['solicitante_id']);
            $table->dropIndex(['creador_id']);
            $table->dropIndex(['auxiliar_id']);
            $table->dropIndex(['area_id']);
            $table->dropIndex(['categoria_id']);
            $table->dropIndex(['prioridad_id']);
        });

        Schema::table('categorias', function (Blueprint $table) {
            $table->dropIndex(['padre_id']);
            $table->dropIndex(['activo']);
        });

        Schema::table('ubicaciones', function (Blueprint $table) {
            $table->dropIndex(['area_id']);
            $table->dropIndex(['activo']);
        });

        Schema::table('areas', function (Blueprint $table) {
            $table->dropIndex(['activo']);
        });

        Schema::table('prioridades', function (Blueprint $table) {
            $table->dropIndex(['activo']);
        });
    }
};
