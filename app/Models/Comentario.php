<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Comentario extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'usuario_id',
        'cuerpo',
        'es_interno',
    ];

    protected function casts(): array
    {
        return [
            'es_interno' => 'boolean',
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

    public function adjuntos(): HasMany
    {
        return $this->hasMany(Adjunto::class);
    }
}
