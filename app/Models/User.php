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
        'area_id',
        'ubicacion_id',
        'telefono',
        'num_empleado',
        'cargo',
        'activo',
        'disponible',
        'max_tickets',
        'whatsapp_telefono',
        'especialidades',
        'debe_cambiar_password',
        'onboarding_completado',
        'fecha_onboarding',
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
            'debe_cambiar_password' => 'boolean',
            'onboarding_completado' => 'boolean',
            'fecha_onboarding' => 'datetime',
        ];
    }

    // ── Helpers de rol ──────────────────────────────────────

    public function esAdmin(): bool
    {
        return $this->rol === Rol::Administrador;
    }

    public function esAuxiliar(): bool
    {
        return $this->rol === Rol::Auxiliar;
    }

    public function esSolicitante(): bool
    {
        return $this->rol === Rol::Solicitante;
    }

    public function requiereOnboarding(): bool
    {
        return $this->esSolicitante() && ! $this->onboarding_completado;
    }

    // ── Relaciones ──────────────────────────────────────────

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function ubicacion(): BelongsTo
    {
        return $this->belongsTo(Ubicacion::class);
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
        return $this->hasMany(Ticket::class, 'auxiliar_id');
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

    public function categoriasEspecialidad(): BelongsToMany
    {
        return $this->belongsToMany(Categoria::class, 'auxiliar_categoria')
            ->withTimestamps();
    }

    public function horariosDisponibilidad(): HasMany
    {
        return $this->hasMany(HorarioAuxiliar::class);
    }
}
