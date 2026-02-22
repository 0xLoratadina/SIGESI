<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')->where('rol', 'Tecnico')->update(['rol' => 'Auxiliar']);

        Schema::table('tickets', function (Blueprint $table) {
            $table->renameColumn('tecnico_id', 'auxiliar_id');
        });

        Schema::rename('tecnico_categoria', 'auxiliar_categoria');

        Schema::table('users', function (Blueprint $table) {
            $table->string('whatsapp_telefono', 20)->nullable();
            $table->text('especialidades')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['whatsapp_telefono', 'especialidades']);
        });

        Schema::rename('auxiliar_categoria', 'tecnico_categoria');

        Schema::table('tickets', function (Blueprint $table) {
            $table->renameColumn('auxiliar_id', 'tecnico_id');
        });

        DB::table('users')->where('rol', 'Auxiliar')->update(['rol' => 'Tecnico']);
    }
};
