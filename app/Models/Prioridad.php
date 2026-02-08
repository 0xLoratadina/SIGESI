<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Prioridad extends Model
{
    use HasFactory;

    protected $table = 'prioridades';

    protected $fillable = [
        'nombre',
        'color',
        'horas_respuesta',
        'horas_resolucion',
        'nivel',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'horas_respuesta' => 'integer',
            'horas_resolucion' => 'integer',
            'nivel' => 'integer',
            'activo' => 'boolean',
        ];
    }

    // ── Relaciones ──────────────────────────────────────────

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }
}
