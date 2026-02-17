<?php

namespace App\Models;

use App\Enums\EstadoTicketChat;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WhatsAppContacto extends Model
{
    use HasFactory;

    protected $fillable = [
        'whatsapp_id',
        'telefono',
        'nombre',
        'avatar',
        'en_linea',
        'ultima_conexion',
        'estado_ticket',
    ];

    protected function casts(): array
    {
        return [
            'en_linea' => 'boolean',
            'ultima_conexion' => 'datetime',
            'estado_ticket' => EstadoTicketChat::class,
        ];
    }

    public function mensajes(): HasMany
    {
        return $this->hasMany(WhatsAppMensaje::class, 'contacto_id');
    }

    public function ultimoMensaje(): ?WhatsAppMensaje
    {
        return $this->mensajes()->latest('enviado_at')->first();
    }

    public function mensajesNoLeidos(): int
    {
        return $this->mensajes()
            ->where('tipo', 'recibido')
            ->where('leido', false)
            ->count();
    }

    public function getIniciales(): string
    {
        return collect(explode(' ', $this->nombre))
            ->map(fn ($palabra) => mb_substr($palabra, 0, 1))
            ->take(2)
            ->join('');
    }
}
