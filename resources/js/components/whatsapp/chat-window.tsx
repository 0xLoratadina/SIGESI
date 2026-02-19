import { ChevronDown, Loader2, PanelRightClose, PanelRightOpen, Reply, Send, X } from 'lucide-react';
import { useRef, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import MessageBubble from '@/components/whatsapp/message-bubble';
import MediaGallery from '@/components/whatsapp/media-gallery';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { enviarMensaje as enviarMensajeAction, marcarLeidos } from '@/actions/App/Http/Controllers/Admin/WhatsAppController';
import type { Chat, Mensaje } from '@/pages/admin/whatsapp/index';

type Props = {
    chat: Chat | null;
    mensajes: Mensaje[];
    onToggleInfo: () => void;
    mostrarInfo: boolean;
    onMensajeEnviado?: (mensaje: Mensaje) => void;
    onCerrarChat?: () => void;
};

export default function ChatWindow({ chat, mensajes, onToggleInfo, mostrarInfo, onMensajeEnviado, onCerrarChat }: Props) {
    const [mensaje, setMensaje] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [mostrarBotonAbajo, setMostrarBotonAbajo] = useState(false);
    const [galeriaUrl, setGaleriaUrl] = useState<string | null>(null);
    const [mensajeRespondiendo, setMensajeRespondiendo] = useState<Mensaje | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const separadorNoLeidosRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const prevMensajesLength = useRef(mensajes.length);

    // Contar mensajes no leídos (solo los recibidos)
    const mensajesNoLeidos = mensajes.filter(m => m.tipo === 'recibido' && !m.leido).length;

    const scrollToBottom = useCallback(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, []);

    const checkIfAtBottom = useCallback(() => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
            setMostrarBotonAbajo(!isAtBottom && scrollHeight > clientHeight);
        }
    }, []);

    // Scroll al primer mensaje no leído o al fondo cuando cambia el chat
    useEffect(() => {
        // Pequeño delay para que el DOM se actualice
        const timer = setTimeout(() => {
            if (separadorNoLeidosRef.current) {
                // Si hay mensajes no leídos, ir al separador
                separadorNoLeidosRef.current.scrollIntoView({ block: 'center' });
            } else if (scrollRef.current) {
                // Si no hay mensajes no leídos, ir al fondo
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
            setMostrarBotonAbajo(false);
        }, 50);

        // Limpiar mensaje respondiendo al cambiar de chat
        setMensajeRespondiendo(null);

        // Marcar mensajes como leídos al entrar al chat (silencioso)
        if (chat && mensajesNoLeidos > 0) {
            const route = marcarLeidos(Number(chat.id));
            axios.post(route.url).catch((err) => console.error('Error al marcar leídos:', err));
        }

        return () => clearTimeout(timer);
    }, [chat?.id]);

    // Verificar posición inicial después de cargar mensajes
    useEffect(() => {
        const timer = setTimeout(() => {
            checkIfAtBottom();
        }, 100);
        return () => clearTimeout(timer);
    }, [mensajes, checkIfAtBottom]);

    // Scroll al fondo cuando llegan nuevos mensajes
    useEffect(() => {
        if (mensajes.length > prevMensajesLength.current) {
            const nuevoMensaje = mensajes[mensajes.length - 1];
            const esEnviadoPorNosotros = nuevoMensaje?.tipo === 'enviado';

            if (esEnviadoPorNosotros) {
                // Si enviamos nosotros, SIEMPRE scroll al fondo
                scrollToBottom();
            } else if (scrollRef.current) {
                // Si es recibido, solo scroll si estábamos cerca del fondo
                const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
                const wasAtBottom = scrollHeight - scrollTop - clientHeight < 100;

                if (wasAtBottom) {
                    scrollToBottom();
                }
            }
        }
        prevMensajesLength.current = mensajes.length;
    }, [mensajes.length, scrollToBottom]);

    function enviarMensaje() {
        if (!mensaje.trim() || !chat || enviando) return;

        const textoMensaje = mensaje.trim();
        const respondiendo = mensajeRespondiendo;
        setEnviando(true);
        setMensaje('');
        setMensajeRespondiendo(null);

        // Crear mensaje optimista para mostrar inmediatamente
        const ahora = new Date();
        const mensajeOptimista: Mensaje = {
            id: `temp-${Date.now()}`,
            tipo: 'enviado',
            contenido: textoMensaje,
            hora: `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`,
            leido: true,
            respuesta_a: respondiendo ? {
                contenido: respondiendo.contenido,
                tipo: respondiendo.tipo,
            } : null,
        };

        // Agregar mensaje a la UI inmediatamente
        onMensajeEnviado?.(mensajeOptimista);

        const route = enviarMensajeAction(Number(chat.id));
        const payload: Record<string, string> = { mensaje: textoMensaje };

        if (respondiendo?.whatsapp_id) {
            payload.respuesta_a_id = respondiendo.whatsapp_id;
            payload.respuesta_a_contenido = respondiendo.contenido.substring(0, 500);
            payload.respuesta_a_tipo = respondiendo.tipo;
        }

        axios.post(route.url, payload)
            .catch((err) => console.error('Error al enviar mensaje:', err))
            .finally(() => setEnviando(false));
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            enviarMensaje();
        }
    }

    if (!chat) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
                <div className="rounded-full bg-muted p-8 mb-4">
                    <Send className="h-10 w-10" />
                </div>
                <p className="text-lg font-semibold">WhatsApp Inbox</p>
                <p className="text-sm mt-1">Selecciona un chat para comenzar</p>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col min-w-0 min-h-0 bg-background">
            {/* Header del chat */}
            <div className="flex h-14 min-h-14 items-center justify-between border-b px-4">
                <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                        <Avatar className="h-10 w-10">
                            {chat.avatar && <AvatarImage src={chat.avatar} alt={chat.nombre} />}
                            <AvatarFallback className="bg-primary/10 text-sm font-medium">
                                {chat.nombre
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div
                            className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${
                                chat.en_linea ? 'bg-green-500' : 'bg-muted-foreground/40'
                            }`}
                        />
                    </div>
                    <div className="min-w-0">
                        <p className="font-medium truncate">{chat.nombre}</p>
                        <p className={`text-xs ${chat.en_linea ? 'text-green-500' : 'text-muted-foreground'}`}>
                            {chat.en_linea ? 'En línea' : chat.telefono}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={onToggleInfo} title={mostrarInfo ? 'Ocultar info' : 'Mostrar info'}>
                        {mostrarInfo ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onCerrarChat} title="Cerrar chat">
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Mensajes */}
            <div className="relative flex-1 min-h-0">
                <div
                    ref={scrollRef}
                    onScroll={checkIfAtBottom}
                    className="absolute inset-0 overflow-y-auto p-4 pb-6 space-y-4 scrollbar-thin"
                >
                    {mensajes.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            <p className="text-sm">No hay mensajes en este chat</p>
                        </div>
                    ) : (
                        (() => {
                            // Encontrar el índice del primer mensaje no leído recibido
                            const primerNoLeidoIndex = mensajes.findIndex(m => m.tipo === 'recibido' && !m.leido);

                            return mensajes.map((msg, index) => (
                                <div key={msg.id}>
                                    {/* Separador de mensajes no leídos */}
                                    {primerNoLeidoIndex === index && mensajesNoLeidos > 0 && (
                                        <div ref={separadorNoLeidosRef} className="flex items-center gap-3 my-4">
                                            <div className="flex-1 h-px bg-primary/30" />
                                            <span className="text-xs bg-primary/90 text-primary-foreground px-3 py-1 rounded-full whitespace-nowrap">
                                                {mensajesNoLeidos} {mensajesNoLeidos === 1 ? 'mensaje no leído' : 'mensajes no leídos'}
                                            </span>
                                            <div className="flex-1 h-px bg-primary/30" />
                                        </div>
                                    )}
                                    <MessageBubble
                                        mensaje={msg}
                                        onMediaClick={(url) => setGaleriaUrl(url)}
                                        onResponder={(m) => {
                                            setMensajeRespondiendo(m);
                                            inputRef.current?.focus();
                                        }}
                                    />
                                </div>
                            ));
                        })()
                    )}
                </div>

                {/* Botón para ir al último mensaje */}
                {mostrarBotonAbajo && (
                    <button
                        onClick={scrollToBottom}
                        className="absolute bottom-4 right-6 z-10 h-10 w-10 rounded-full bg-background border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-all"
                        title="Ir al último mensaje"
                    >
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    </button>
                )}
            </div>

            {/* Barra de respuesta */}
            {mensajeRespondiendo && (
                <div className="shrink-0 border-t bg-muted/50 px-4 py-2">
                    <div className="flex items-center gap-2">
                        <Reply className="h-4 w-4 text-primary shrink-0" />
                        <div className={`flex-1 min-w-0 border-l-2 pl-2 ${
                            mensajeRespondiendo.tipo === 'enviado' ? 'border-blue-500' : 'border-primary'
                        }`}>
                            <p className="text-xs font-medium text-primary">
                                {mensajeRespondiendo.tipo === 'enviado' ? 'Tú' : 'Contacto'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {mensajeRespondiendo.contenido}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => setMensajeRespondiendo(null)}
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Input de mensaje */}
            <div className={`shrink-0 ${!mensajeRespondiendo ? 'border-t' : ''} p-4`}>
                <div className="flex items-center gap-3">
                    <Input
                        ref={inputRef}
                        placeholder="Escribe un mensaje..."
                        value={mensaje}
                        onChange={(e) => setMensaje(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 h-10"
                    />
                    <Button
                        size="icon"
                        onClick={enviarMensaje}
                        disabled={!mensaje.trim() || enviando}
                        className="h-10 w-10 shrink-0"
                    >
                        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* Galería de media */}
            {galeriaUrl && (
                <MediaGallery
                    mensajes={mensajes}
                    urlActiva={galeriaUrl}
                    onClose={() => setGaleriaUrl(null)}
                />
            )}
        </div>
    );
}
