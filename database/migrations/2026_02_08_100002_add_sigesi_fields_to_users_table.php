<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Perfil basico
            $table->string('rol')->default('Solicitante');
            $table->foreignId('departamento_id')->nullable()->constrained('departamentos')->nullOnDelete();
            $table->string('telefono', 20)->nullable();
            $table->string('num_empleado', 50)->unique()->nullable();
            $table->string('cargo', 100)->nullable();
            $table->boolean('activo')->default(true);

            // Campos de tecnico (solo relevantes cuando rol = Tecnico)
            $table->boolean('disponible')->default(true);
            $table->unsignedTinyInteger('max_tickets')->default(10);

            $table->index('rol');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('departamento_id');
            $table->dropIndex(['rol']);
            $table->dropColumn([
                'rol', 'telefono', 'num_empleado', 'cargo', 'activo',
                'disponible', 'max_tickets',
            ]);
        });
    }
};
