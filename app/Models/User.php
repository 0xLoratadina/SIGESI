<?php

namespace App\Models;

use App\Enums\Rol;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'rol',
        'departamento_id',
        'telefono',
        'num_empleado',
        'cargo',
        'activo',
        'disponible',
        'max_tickets',
    ];

    /**
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'rol' => Rol::class,
            'activo' => 'boolean',
            'disponible' => 'boolean',
            'max_tickets' => 'integer',
        ];
    }

    // ── Helpers de rol ──────────────────────────────────────

    public function esAdmin(): bool
    {
        return $this->rol === Rol::Administrador;
    }

    public function esTecnico(): bool
    {
        return $this->rol === Rol::Tecnico;
    }

    public function esSolicitante(): bool
    {
        return $this->rol === Rol::Solicitante;
    }

    // ── Relaciones ──────────────────────────────────────────

    public function departamento(): BelongsTo
    {
        return $this->belongsTo(Departamento::class);
    }

    public function ticketsSolicitados(): HasMany
    {
        return $this->hasMany(Ticket::class, 'solicitante_id');
    }

    public function ticketsCreados(): HasMany
    {
        return $this->hasMany(Ticket::class, 'creador_id');
    }

    public function ticketsAsignados(): HasMany
    {
        return $this->hasMany(Ticket::class, 'tecnico_id');
    }

    public function comentarios(): HasMany
    {
        return $this->hasMany(Comentario::class, 'usuario_id');
    }

    public function adjuntos(): HasMany
    {
        return $this->hasMany(Adjunto::class, 'usuario_id');
    }

    public function actividades(): HasMany
    {
        return $this->hasMany(Actividad::class, 'usuario_id');
    }

    public function articulos(): HasMany
    {
        return $this->hasMany(Articulo::class, 'autor_id');
    }

    public function especialidades(): BelongsToMany
    {
        return $this->belongsToMany(Categoria::class, 'tecnico_categoria')
            ->withTimestamps();
    }
}
