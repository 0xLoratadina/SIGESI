<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Categoria extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
        'descripcion',
        'padre_id',
        'icono',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
        ];
    }

    // ── Relaciones ──────────────────────────────────────────

    public function padre(): BelongsTo
    {
        return $this->belongsTo(self::class, 'padre_id');
    }

    public function hijas(): HasMany
    {
        return $this->hasMany(self::class, 'padre_id');
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    public function articulos(): HasMany
    {
        return $this->hasMany(Articulo::class);
    }

    public function tecnicos(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'tecnico_categoria')
            ->withTimestamps();
    }
}
