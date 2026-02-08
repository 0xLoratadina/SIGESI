<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Adjunto extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'comentario_id',
        'usuario_id',
        'nombre',
        'ruta',
        'tamano',
        'tipo_mime',
    ];

    protected function casts(): array
    {
        return [
            'tamano' => 'integer',
        ];
    }

    // ── Relaciones ──────────────────────────────────────────

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function comentario(): BelongsTo
    {
        return $this->belongsTo(Comentario::class);
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
}
