<?php

namespace App\Models;

use App\Enums\TipoMensajeWhatsApp;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsAppMensaje extends Model
{
    use HasFactory;

    protected $fillable = [
        'whatsapp_id',
        'contacto_id',
        'tipo',
        'contenido',
        'leido',
        'es_bot',
        'media_url',
        'media_tipo',
        'enviado_at',
    ];

    protected function casts(): array
    {
        return [
            'tipo' => TipoMensajeWhatsApp::class,
            'leido' => 'boolean',
            'es_bot' => 'boolean',
            'enviado_at' => 'datetime',
        ];
    }

    public function contacto(): BelongsTo
    {
        return $this->belongsTo(WhatsAppContacto::class, 'contacto_id');
    }

    public function getHoraFormateada(): string
    {
        return $this->enviado_at->format('H:i');
    }
}
