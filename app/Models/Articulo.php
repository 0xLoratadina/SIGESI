<?php

namespace App\Models;

use App\Enums\EstadoArticulo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Articulo extends Model
{
    use HasFactory;

    protected $fillable = [
        'titulo',
        'slug',
        'contenido',
        'categoria_id',
        'autor_id',
        'estado',
        'vistas',
        'fecha_publicacion',
    ];

    protected function casts(): array
    {
        return [
            'estado' => EstadoArticulo::class,
            'vistas' => 'integer',
            'fecha_publicacion' => 'datetime',
        ];
    }

    // ── Relaciones ──────────────────────────────────────────

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class);
    }

    public function autor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'autor_id');
    }
}
