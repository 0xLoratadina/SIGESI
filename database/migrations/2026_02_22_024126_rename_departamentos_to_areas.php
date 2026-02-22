<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // SQLite: eliminar el indice unique antes de renombrar la tabla
        DB::statement('DROP INDEX IF EXISTS departamentos_codigo_unique');

        Schema::rename('departamentos', 'areas');

        Schema::table('areas', function (Blueprint $table) {
            $table->dropColumn(['codigo', 'telefono', 'jefe']);
        });

        Schema::table('areas', function (Blueprint $table) {
            $table->unsignedTinyInteger('nivel_prioridad')->default(3);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('departamento_id', 'area_id');
        });

        Schema::table('tickets', function (Blueprint $table) {
            $table->renameColumn('departamento_id', 'area_id');
        });

        Schema::table('ubicaciones', function (Blueprint $table) {
            $table->renameColumn('departamento_id', 'area_id');
        });
    }

    public function down(): void
    {
        Schema::table('ubicaciones', function (Blueprint $table) {
            $table->renameColumn('area_id', 'departamento_id');
        });

        Schema::table('tickets', function (Blueprint $table) {
            $table->renameColumn('area_id', 'departamento_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('area_id', 'departamento_id');
        });

        Schema::table('areas', function (Blueprint $table) {
            $table->dropColumn('nivel_prioridad');
        });

        Schema::table('areas', function (Blueprint $table) {
            $table->string('codigo', 10)->nullable();
            $table->string('telefono', 20)->nullable();
            $table->string('jefe', 150)->nullable();
        });

        Schema::rename('areas', 'departamentos');

        Schema::table('departamentos', function (Blueprint $table) {
            $table->unique('codigo');
        });
    }
};
