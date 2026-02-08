<?php

namespace App\Models;

use App\Enums\TipoActividad;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Actividad extends Model
{
    use HasFactory;

    protected $table = 'actividades';

    const UPDATED_AT = null;

    protected $fillable = [
        'ticket_id',
        'usuario_id',
        'tipo',
        'descripcion',
        'valor_anterior',
        'valor_nuevo',
    ];

    protected function casts(): array
    {
        return [
            'tipo' => TipoActividad::class,
        ];
    }

    // ── Relaciones ──────────────────────────────────────────

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
}
