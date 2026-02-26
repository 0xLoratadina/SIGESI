import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, MessageSquare } from 'lucide-react';
import { actualizaciones, estado as estadoRoute, sincronizar } from '@/actions/App/Http/Controllers/Admin/WhatsAppController';
import { Card } from '@/components/ui/card';
import ChatList from '@/components/whatsapp/chat-list';
import ChatWindow from '@/components/whatsapp/chat-window';
import ContactInfo from '@/components/whatsapp/contact-info';
import WhatsAppSetupPage from '@/components/whatsapp/whatsapp-setup-page';
import AppLayout from '@/layouts/app-layout';
import { whatsapp } from '@/routes/admin';
import type { BreadcrumbItem } from '@/types';

export type EstadoTicketChat =
    | 'sin_ticket'
    | 'pendiente'
    | 'en_proceso'
    | 'cerrado';

export type Chat = {
    id: string;
    nombre: string;
    telefono: string;
    avatar: string | null;
    ultimo_mensaje: string;
    hora_ultimo: string;
    ultimo_mensaje_at: string | null;
    no_leidos: number;
    en_linea: boolean;
    estado_ticket: EstadoTicketChat;
};

export type MediaTipo =
    | 'imagen'
    | 'video'
    | 'audio'
    | 'documento'
    | 'sticker'
    | null;

export type Mensaje = {
    id: string;
    whatsapp_id?: string | null;
    tipo: 'recibido' | 'enviado';
    contenido: string;
    hora: string;
    leido: boolean;
    es_bot?: boolean;
    media_url?: string | null;
    media_tipo?: MediaTipo;
    respuesta_a?: { contenido: string; tipo: 'recibido' | 'enviado' } | null;
};

export type TicketResumen = {
    id: number;
    numero: string;
    titulo: string;
    estado: string;
    color_estado: string;
};

type Props = {
    chats: Chat[];
    mensajes?: Record<string, Mensaje[]>;
    tickets: Record<string, TicketResumen[]>;
    estadoConexion: 'desconectado' | 'conectando' | 'conectado';
    ultimaActualizacion: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'WhatsApp', href: whatsapp().url },
];

// Intervalos de polling adaptativos
const INTERVALO_CON_CHAT = 2000;  // 2s con chat activo
const INTERVALO_SIN_CHAT = 5000;  // 5s sin chat activo
const INTERVALO_RAPIDO = 1000;    // 1s después de mensaje nuevo
const DURACION_RAPIDO = 20000;    // 20s en modo rápido

function ordenarChats(chats: Chat[]): Chat[] {
    return [...chats].sort((a, b) => {
        if (!a.ultimo_mensaje_at && !b.ultimo_mensaje_at) return 0;
        if (!a.ultimo_mensaje_at) return 1;
        if (!b.ultimo_mensaje_at) return -1;
        return (
            new Date(b.ultimo_mensaje_at).getTime() -
            new Date(a.ultimo_mensaje_at).getTime()
        );
    });
}

export default function WhatsAppInbox({
    chats: chatsIniciales,
    mensajes: mensajesIniciales,
    tickets,
    estadoConexion,
    ultimaActualizacion,
}: Props) {
    const [chatActivo, setChatActivo] = useState<string | null>(null);
    const [mostrarInfo, setMostrarInfo] = useState(true);
    const [chats, setChats] = useState<Chat[]>(chatsIniciales);
    const [mensajes, setMensajes] = useState<Record<string, Mensaje[]>>(
        mensajesIniciales ?? {},
    );
    const ultimoTimestamp = useRef<string>(ultimaActualizacion);
    const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const modoRapidoHasta = useRef<number>(0);
    const [conexion, setConexion] = useState(estadoConexion);
    // Usar ref para chatActivo para evitar recrear el callback de polling
    const chatActivoRef = useRef<string | null>(chatActivo);
    const conexionRef = useRef(conexion);

    // Mantener refs sincronizados
    useEffect(() => {
        chatActivoRef.current = chatActivo;
    }, [chatActivo]);

    useEffect(() => {
        conexionRef.current = conexion;
    }, [conexion]);
    const [sincronizando, setSincronizando] = useState(false);

    // Handler para cambio de estado de conexión
    const handleEstadoCambiado = useCallback(
        (nuevoEstado: typeof estadoConexion) => {
            if (nuevoEstado === 'conectado') {
                // Mostrar pantalla de sincronización
                setConexion('conectado');
                setSincronizando(true);

                // Mover timestamp 2 min atrás para capturar mensajes que llegaron
                const dosMinutosAtras = new Date(Date.now() - 2 * 60 * 1000).toISOString();
                ultimoTimestamp.current = dosMinutosAtras;
                modoRapidoHasta.current = Date.now() + DURACION_RAPIDO;

                // Sincronizar todo desde Evolution API
                axios.post(sincronizar().url)
                    .then(() => {
                        router.reload({
                            only: ['chats', 'mensajes', 'estadoConexion'],
                            onFinish: () => setSincronizando(false),
                        });
                    })
                    .catch(() => {
                        router.reload({
                            only: ['chats', 'mensajes', 'estadoConexion'],
                            onFinish: () => setSincronizando(false),
                        });
                    });
            } else if (nuevoEstado === 'desconectado') {
                setConexion('desconectado');
                setSincronizando(false);
                setChats([]);
                setMensajes({});
                setChatActivo(null);
                modoRapidoHasta.current = 0;
            } else {
                setConexion(nuevoEstado);
            }
        },
        [],
    );

    // Función para obtener actualizaciones (estable, usa refs)
    const fetchActualizaciones = useCallback(
        async (signal?: AbortSignal) => {
            if (conexionRef.current !== 'conectado') return;

            try {
                const route = actualizaciones();
                const response = await axios.get(route.url, {
                    params: {
                        desde: ultimoTimestamp.current,
                        chat_activo: chatActivoRef.current,
                    },
                    signal,
                });

                const data = response.data;

                if (data.hayNuevos) {
                    // Activar modo rápido por 30 segundos
                    modoRapidoHasta.current = Date.now() + DURACION_RAPIDO;

                    // Actualizar mensajes
                    setMensajes((prevMensajes) => {
                        const nuevosMensajes = { ...prevMensajes };
                        for (const [contactoId, msgs] of Object.entries(
                            data.mensajes as Record<string, Mensaje[]>,
                        )) {
                            if (!nuevosMensajes[contactoId]) {
                                nuevosMensajes[contactoId] = [];
                            }

                            const existentes = nuevosMensajes[contactoId];
                            const idsExistentes = new Set(
                                existentes.map((m) => m.id),
                            );

                            for (const msg of msgs) {
                                if (idsExistentes.has(msg.id)) continue;

                                // Buscar y reemplazar mensaje optimista (temp-*) que coincida
                                const tempIdx = existentes.findIndex(
                                    (m) =>
                                        m.id.startsWith('temp-') &&
                                        m.contenido === msg.contenido &&
                                        m.tipo === msg.tipo,
                                );
                                if (tempIdx !== -1) {
                                    existentes[tempIdx] = msg;
                                } else {
                                    existentes.push(msg);
                                }
                            }

                            nuevosMensajes[contactoId] = [...existentes];
                        }
                        return nuevosMensajes;
                    });

                    // Actualizar chats
                    setChats((prevChats) => {
                        const chatsMap = new Map(
                            prevChats.map((c) => [c.id, c]),
                        );
                        for (const [chatId, chatActualizado] of Object.entries(
                            data.chats as Record<string, Chat>,
                        )) {
                            chatsMap.set(chatId, chatActualizado);
                        }
                        return ordenarChats(Array.from(chatsMap.values()));
                    });
                }

                ultimoTimestamp.current = data.timestamp;
            } catch (error) {
                if (axios.isCancel(error)) return;
                console.error('Error al obtener actualizaciones:', error);
            }
        },
        [], // Sin dependencias - usa refs para valores que cambian
    );

    // Polling adaptativo - estable, no se reinicia con cambios de chatActivo
    useEffect(() => {
        if (conexion !== 'conectado' || sincronizando) return;

        const abortController = new AbortController();
        let isActive = true;

        const obtenerIntervalo = (): number => {
            if (Date.now() < modoRapidoHasta.current) {
                return INTERVALO_RAPIDO;
            }
            return chatActivoRef.current ? INTERVALO_CON_CHAT : INTERVALO_SIN_CHAT;
        };

        const ejecutarPolling = async () => {
            if (!isActive || abortController.signal.aborted) return;

            await fetchActualizaciones(abortController.signal);

            if (!isActive || abortController.signal.aborted) return;

            const intervalo = obtenerIntervalo();
            pollingRef.current = setTimeout(ejecutarPolling, intervalo);
        };

        // Primera consulta rápida al conectar
        pollingRef.current = setTimeout(ejecutarPolling, 500);

        return () => {
            isActive = false;
            abortController.abort();
            if (pollingRef.current) {
                clearTimeout(pollingRef.current);
            }
        };
    }, [conexion, sincronizando, fetchActualizaciones]);

    // Verificar periódicamente si la sesión sigue activa (para detectar desconexiones externas)
    useEffect(() => {
        if (conexion !== 'conectado') return;

        const interval = setInterval(async () => {
            try {
                const res = await axios.get(estadoRoute().url);
                if (!res.data.conectado) {
                    handleEstadoCambiado('desconectado');
                }
            } catch {
                // ignore errores de red
            }
        }, 15000);

        return () => clearInterval(interval);
    }, [conexion, handleEstadoCambiado]);

    // Actualizar cuando cambian los props iniciales (reload de Inertia)
    useEffect(() => {
        setChats(chatsIniciales);
    }, [chatsIniciales]);

    useEffect(() => {
        if (mensajesIniciales) {
            setMensajes(mensajesIniciales);
        }
    }, [mensajesIniciales]);

    useEffect(() => {
        ultimoTimestamp.current = ultimaActualizacion;
    }, [ultimaActualizacion]);

    const chatSeleccionado = chats.find((c) => c.id === chatActivo);
    const mensajesChat = chatActivo ? (mensajes[chatActivo] ?? []) : [];
    const ticketsChat = chatActivo ? (tickets[chatActivo] ?? []) : [];

    // Handler para cuando se envía un mensaje (actualización optimista)
    const handleMensajeEnviado = useCallback(
        (mensaje: Mensaje) => {
            if (!chatActivo) return;

            // Agregar mensaje al estado local
            setMensajes((prev) => ({
                ...prev,
                [chatActivo]: [...(prev[chatActivo] ?? []), mensaje],
            }));

            // Actualizar último mensaje del chat y reordenar
            setChats((prev) =>
                ordenarChats(
                    prev.map((chat) =>
                        chat.id === chatActivo
                            ? {
                                ...chat,
                                ultimo_mensaje: mensaje.contenido,
                                hora_ultimo: mensaje.hora,
                                ultimo_mensaje_at: new Date().toISOString(),
                            }
                            : chat,
                    ),
                ),
            );

            // Activar modo rápido para detectar la confirmación del servidor
            modoRapidoHasta.current = Date.now() + DURACION_RAPIDO;
        },
        [chatActivo],
    );

    // Handler para cuando se descarga media bajo demanda
    const handleMediaLoaded = useCallback(
        (mensajeId: string, mediaUrl: string) => {
            setMensajes((prev) => {
                const updated = { ...prev };
                for (const contactoId of Object.keys(updated)) {
                    updated[contactoId] = updated[contactoId].map((m) =>
                        m.id === mensajeId ? { ...m, media_url: mediaUrl } : m,
                    );
                }
                return updated;
            });
        },
        [],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="WhatsApp Inbox" />

            <div className="flex h-full min-h-0 flex-1 flex-col p-4">
                {conexion === 'desconectado' || conexion === 'conectando' ? (
                    <Card className="flex min-h-0 flex-1 overflow-hidden">
                        <WhatsAppSetupPage onEstadoCambiado={handleEstadoCambiado} />
                    </Card>
                ) : sincronizando ? (
                    <Card className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
                        <div className="flex flex-col items-center gap-8 px-8">
                            {/* Icono animado */}
                            <div className="relative">
                                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                                    <MessageSquare className="h-12 w-12 text-primary" />
                                </div>
                                <div className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-md">
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                </div>
                            </div>

                            {/* Texto */}
                            <div className="flex flex-col items-center gap-2 text-center">
                                <h2 className="text-xl font-semibold tracking-tight">
                                    Sincronizando mensajes
                                </h2>
                                <p className="max-w-xs text-sm text-muted-foreground">
                                    Estamos descargando tus chats y mensajes. Esto puede tardar unos momentos.
                                </p>
                            </div>

                            {/* Barra de progreso animada */}
                            <div className="w-72 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-1.5 rounded-full bg-primary"
                                    style={{
                                        animation: 'sync-progress 2.5s ease-in-out infinite',
                                    }}
                                />
                            </div>

                            <style>{`
                                @keyframes sync-progress {
                                    0% { width: 0%; margin-left: 0; }
                                    50% { width: 70%; margin-left: 15%; }
                                    100% { width: 0%; margin-left: 100%; }
                                }
                            `}</style>
                        </div>
                    </Card>
                ) : (
                    <Card className="flex min-h-0 flex-1 flex-row overflow-hidden">
                        {/* Lista de chats */}
                        <ChatList
                            chats={chats}
                            chatActivo={chatActivo}
                            onSelectChat={setChatActivo}
                            estadoConexion={conexion}
                            onEstadoCambiado={handleEstadoCambiado}
                        />

                        {/* Ventana de chat */}
                        <ChatWindow
                            chat={chatSeleccionado ?? null}
                            mensajes={mensajesChat}
                            onToggleInfo={() => setMostrarInfo(!mostrarInfo)}
                            mostrarInfo={mostrarInfo}
                            onMensajeEnviado={handleMensajeEnviado}
                            onCerrarChat={() => setChatActivo(null)}
                            onMediaLoaded={handleMediaLoaded}
                        />

                        {/* Info del contacto */}
                        {mostrarInfo && chatSeleccionado && (
                            <ContactInfo
                                chat={chatSeleccionado}
                                tickets={ticketsChat}
                            />
                        )}
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
