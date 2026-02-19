import { Head } from '@inertiajs/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import ChatList from '@/components/whatsapp/chat-list';
import ChatWindow from '@/components/whatsapp/chat-window';
import ContactInfo from '@/components/whatsapp/contact-info';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { whatsapp } from '@/routes/admin';
import { actualizaciones } from '@/actions/App/Http/Controllers/Admin/WhatsAppController';
import type { BreadcrumbItem } from '@/types';

export type EstadoTicketChat = 'sin_ticket' | 'pendiente' | 'en_proceso' | 'cerrado';

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

export type MediaTipo = 'imagen' | 'video' | 'audio' | 'documento' | 'sticker' | null;

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
    mensajes: Record<string, Mensaje[]>;
    tickets: Record<string, TicketResumen[]>;
    estadoConexion: 'desconectado' | 'conectando' | 'conectado';
    ultimaActualizacion: string;
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'WhatsApp', href: whatsapp().url }];

// Intervalos de polling adaptativos
const INTERVALO_CON_CHAT = 5000;     // 5s con chat activo
const INTERVALO_SIN_CHAT = 15000;    // 15s sin chat activo
const INTERVALO_RAPIDO = 3000;       // 3s después de mensaje nuevo
const DURACION_RAPIDO = 30000;       // 30s en modo rápido

function ordenarChats(chats: Chat[]): Chat[] {
    return [...chats].sort((a, b) => {
        if (!a.ultimo_mensaje_at && !b.ultimo_mensaje_at) return 0;
        if (!a.ultimo_mensaje_at) return 1;
        if (!b.ultimo_mensaje_at) return -1;
        return new Date(b.ultimo_mensaje_at).getTime() - new Date(a.ultimo_mensaje_at).getTime();
    });
}

export default function WhatsAppInbox({ chats: chatsIniciales, mensajes: mensajesIniciales, tickets, estadoConexion, ultimaActualizacion }: Props) {
    const [chatActivo, setChatActivo] = useState<string | null>(null);
    const [mostrarInfo, setMostrarInfo] = useState(true);
    const [chats, setChats] = useState<Chat[]>(chatsIniciales);
    const [mensajes, setMensajes] = useState<Record<string, Mensaje[]>>(mensajesIniciales);
    const ultimoTimestamp = useRef<string>(ultimaActualizacion);
    const pollingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const modoRapidoHasta = useRef<number>(0);

    // Calcular intervalo de polling adaptativo
    const obtenerIntervalo = useCallback((): number => {
        if (Date.now() < modoRapidoHasta.current) {
            return INTERVALO_RAPIDO;
        }
        return chatActivo ? INTERVALO_CON_CHAT : INTERVALO_SIN_CHAT;
    }, [chatActivo]);

    // Función para obtener actualizaciones
    const fetchActualizaciones = useCallback(async () => {
        if (estadoConexion !== 'conectado') return;

        try {
            const route = actualizaciones();
            const response = await axios.get(route.url, {
                params: {
                    desde: ultimoTimestamp.current,
                    chat_activo: chatActivo,
                }
            });

            const data = response.data;

            if (data.hayNuevos) {
                // Activar modo rápido por 30 segundos
                modoRapidoHasta.current = Date.now() + DURACION_RAPIDO;

                // Actualizar mensajes
                setMensajes(prevMensajes => {
                    const nuevosMensajes = { ...prevMensajes };
                    for (const [contactoId, msgs] of Object.entries(data.mensajes as Record<string, Mensaje[]>)) {
                        if (!nuevosMensajes[contactoId]) {
                            nuevosMensajes[contactoId] = [];
                        }

                        const existentes = nuevosMensajes[contactoId];
                        const idsExistentes = new Set(existentes.map(m => m.id));

                        for (const msg of msgs) {
                            if (idsExistentes.has(msg.id)) continue;

                            // Buscar y reemplazar mensaje optimista (temp-*) que coincida
                            const tempIdx = existentes.findIndex(
                                m => m.id.startsWith('temp-') && m.contenido === msg.contenido && m.tipo === msg.tipo
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
                setChats(prevChats => {
                    const chatsMap = new Map(prevChats.map(c => [c.id, c]));
                    for (const [chatId, chatActualizado] of Object.entries(data.chats as Record<string, Chat>)) {
                        chatsMap.set(chatId, chatActualizado);
                    }
                    return ordenarChats(Array.from(chatsMap.values()));
                });
            }

            ultimoTimestamp.current = data.timestamp;
        } catch (error) {
            console.error('Error al obtener actualizaciones:', error);
        }
    }, [estadoConexion, chatActivo]);

    // Polling adaptativo con setTimeout recursivo
    useEffect(() => {
        if (estadoConexion !== 'conectado') return;

        let cancelado = false;

        const programarSiguiente = () => {
            if (cancelado) return;
            const intervalo = obtenerIntervalo();
            pollingTimeout.current = setTimeout(async () => {
                await fetchActualizaciones();
                programarSiguiente();
            }, intervalo);
        };

        // Primera consulta inmediata
        fetchActualizaciones().then(programarSiguiente);

        return () => {
            cancelado = true;
            if (pollingTimeout.current) {
                clearTimeout(pollingTimeout.current);
            }
        };
    }, [estadoConexion, fetchActualizaciones, obtenerIntervalo]);

    // Actualizar cuando cambian los props iniciales (reload de Inertia)
    useEffect(() => {
        setChats(chatsIniciales);
        setMensajes(mensajesIniciales);
        ultimoTimestamp.current = ultimaActualizacion;
    }, [chatsIniciales, mensajesIniciales, ultimaActualizacion]);

    const chatSeleccionado = chats.find((c) => c.id === chatActivo);
    const mensajesChat = chatActivo ? mensajes[chatActivo] ?? [] : [];
    const ticketsChat = chatActivo ? tickets[chatActivo] ?? [] : [];

    // Handler para cuando se envía un mensaje (actualización optimista)
    const handleMensajeEnviado = useCallback((mensaje: Mensaje) => {
        if (!chatActivo) return;

        // Agregar mensaje al estado local
        setMensajes(prev => ({
            ...prev,
            [chatActivo]: [...(prev[chatActivo] ?? []), mensaje]
        }));

        // Actualizar último mensaje del chat y reordenar
        setChats(prev => ordenarChats(prev.map(chat =>
            chat.id === chatActivo
                ? { ...chat, ultimo_mensaje: mensaje.contenido, hora_ultimo: mensaje.hora, ultimo_mensaje_at: new Date().toISOString() }
                : chat
        )));
    }, [chatActivo]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="WhatsApp Inbox" />

            <div className="flex h-full flex-1 flex-col p-4 min-h-0">
                <Card className="flex flex-1 flex-row overflow-hidden min-h-0">
                    {/* Lista de chats */}
                    <ChatList
                        chats={chats}
                        chatActivo={chatActivo}
                        onSelectChat={setChatActivo}
                        estadoConexion={estadoConexion}
                    />

                    {/* Ventana de chat */}
                    <ChatWindow
                        chat={chatSeleccionado ?? null}
                        mensajes={mensajesChat}
                        onToggleInfo={() => setMostrarInfo(!mostrarInfo)}
                        mostrarInfo={mostrarInfo}
                        onMensajeEnviado={handleMensajeEnviado}
                        onCerrarChat={() => setChatActivo(null)}
                    />

                    {/* Info del contacto */}
                    {mostrarInfo && chatSeleccionado && (
                        <ContactInfo chat={chatSeleccionado} tickets={ticketsChat} />
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}
