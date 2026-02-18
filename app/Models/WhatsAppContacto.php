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

    /**
     * Buscar o crear contacto de forma centralizada.
     * Busca por whatsapp_id primero, luego telefono, luego crea.
     * Maneja JIDs en formato @s.whatsapp.net, @c.us y @lid.
     *
     * @param  array<string, mixed>  $atributos
     */
    public static function buscarOCrear(string $remoteJid, array $atributos = []): ?self
    {
        $telefono = self::extraerTelefono($remoteJid);
        $esLid = str_ends_with($remoteJid, '@lid');

        // 1. Buscar por whatsapp_id exacto
        $contacto = self::where('whatsapp_id', $remoteJid)->first();
        if ($contacto) {
            return $contacto;
        }

        // 2. Si es @lid, buscar si existe un contacto @lid que ya migramos
        //    o intentar encontrar el contacto real por nombre
        if ($esLid) {
            // Buscar contacto existente que tenga este @lid como whatsapp_id
            // (ya manejado arriba)

            // Intentar encontrar contacto real por pushName si lo tenemos
            $nombre = $atributos['nombre'] ?? null;
            if ($nombre && $nombre !== $remoteJid) {
                $contactoPorNombre = self::where('nombre', $nombre)
                    ->where('whatsapp_id', 'NOT LIKE', '%@lid')
                    ->first();
                if ($contactoPorNombre) {
                    return $contactoPorNombre;
                }
            }

            // No crear contacto nuevo con @lid, guardar con JID completo
            return self::firstOrCreate(
                ['whatsapp_id' => $remoteJid],
                array_merge([
                    'telefono' => $remoteJid,
                    'nombre' => $atributos['nombre'] ?? $remoteJid,
                    'en_linea' => $atributos['en_linea'] ?? false,
                ], $atributos)
            );
        }

        // 3. Buscar por teléfono (formato normal @s.whatsapp.net)
        if ($telefono) {
            $contacto = self::where('telefono', $telefono)->first();
            if ($contacto) {
                // Actualizar whatsapp_id si cambió
                if ($contacto->whatsapp_id !== $remoteJid) {
                    $contacto->update(['whatsapp_id' => $remoteJid]);
                }

                return $contacto;
            }
        }

        // 4. Crear nuevo contacto
        return self::create(array_merge([
            'whatsapp_id' => $remoteJid,
            'telefono' => $telefono ?: $remoteJid,
            'nombre' => $atributos['nombre'] ?? $telefono ?: $remoteJid,
            'en_linea' => false,
        ], $atributos));
    }

    /**
     * Extraer número de teléfono de un JID de WhatsApp.
     * Retorna null para JIDs que no son de contacto individual.
     */
    public static function extraerTelefono(string $jid): ?string
    {
        // Grupos
        if (str_contains($jid, '@g.us')) {
            return null;
        }

        // Linked IDs - no tienen teléfono
        if (str_ends_with($jid, '@lid')) {
            return null;
        }

        return str_replace(['@s.whatsapp.net', '@c.us'], '', $jid);
    }

    /**
     * Fusionar un contacto @lid con este contacto (mover mensajes).
     */
    public function fusionarDesde(self $contactoLid): void
    {
        // Mover todos los mensajes del contacto @lid a este
        WhatsAppMensaje::where('contacto_id', $contactoLid->id)
            ->update(['contacto_id' => $this->id]);

        // Eliminar el contacto @lid
        $contactoLid->delete();
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
