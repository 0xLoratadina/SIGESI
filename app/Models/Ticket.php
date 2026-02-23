<?php

namespace App\Models;

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
        'area_id',
        'categoria_id',
        'prioridad_id',
        'ubicacion_id',
        'estado',
        'auxiliar_id',
        'asignado_por',
        'fecha_asignacion',
        'fecha_resolucion',
        'fecha_cierre',
        'solucion',
        'calificacion',
        'comentario_cal',
        'fecha_limite',
    ];

    protected static function booted(): void
    {
        static::creating(function (Ticket $ticket) {
            if (empty($ticket->numero)) {
                $ticket->numero = self::generarNumero();
            }
        });
    }

    public static function generarNumero(): string
    {
        $ultimo = static::query()
            ->orderByRaw('CAST(SUBSTR(numero, 4) AS INTEGER) DESC')
            ->value('numero');

        $secuencial = $ultimo ? (int) substr($ultimo, 3) + 1 : 1;

        return 'TK-'.str_pad($secuencial, 4, '0', STR_PAD_LEFT);
    }

    protected function casts(): array
    {
        return [
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

    public function auxiliar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'auxiliar_id');
    }

    public function asignadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'asignado_por');
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
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
