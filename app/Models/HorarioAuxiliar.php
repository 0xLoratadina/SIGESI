<?php

namespace App\Models;

use App\Enums\Dia;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HorarioAuxiliar extends Model
{
    /** @use HasFactory<\Database\Factories\HorarioAuxiliarFactory> */
    use HasFactory;

    protected $table = 'horarios_auxiliar';

    protected $fillable = [
        'user_id',
        'dia',
        'hora_inicio',
        'hora_fin',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'dia' => Dia::class,
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
