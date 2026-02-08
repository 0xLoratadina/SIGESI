<?php

namespace App\Models;

use App\Enums\Canal;
use App\Enums\EstadoTicket;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    use HasFactory;

    protected $fillable = [
        'numero',
        'titulo',
        'descripcion',
        'solicitante_id',
        'creador_id',
        'departamento_id',
        'categoria_id',
        'prioridad_id',
        'ubicacion_id',
        'canal',
        'estado',
        'tecnico_id',
        'asignado_por',
        'fecha_asignacion',
        'fecha_resolucion',
        'fecha_cierre',
        'solucion',
        'calificacion',
        'comentario_cal',
        'fecha_limite',
    ];

    protected function casts(): array
    {
        return [
            'canal' => Canal::class,
            'estado' => EstadoTicket::class,
            'fecha_asignacion' => 'datetime',
            'fecha_resolucion' => 'datetime',
            'fecha_cierre' => 'datetime',
            'fecha_limite' => 'datetime',
            'calificacion' => 'integer',
        ];
    }

    // ── Relaciones ──────────────────────────────────────────

    public function solicitante(): BelongsTo
    {
        return $this->belongsTo(User::class, 'solicitante_id');
    }

    public function creador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creador_id');
    }

    public function tecnico(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tecnico_id');
    }

    public function asignadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'asignado_por');
    }

    public function departamento(): BelongsTo
    {
        return $this->belongsTo(Departamento::class);
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class);
    }

    public function prioridad(): BelongsTo
    {
        return $this->belongsTo(Prioridad::class);
    }

    public function ubicacion(): BelongsTo
    {
        return $this->belongsTo(Ubicacion::class);
    }

    public function comentarios(): HasMany
    {
        return $this->hasMany(Comentario::class);
    }

    public function adjuntos(): HasMany
    {
        return $this->hasMany(Adjunto::class);
    }

    public function actividades(): HasMany
    {
        return $this->hasMany(Actividad::class);
    }
}
