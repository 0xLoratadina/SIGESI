import { router } from '@inertiajs/react';
import axios from 'axios';
import {
    Camera,
    FileText,
    Loader2,
    MessageSquarePlus,
    Mic,
    Search,
    ArrowLeft,
    Send,
    RefreshCw,
    Video,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import WhatsAppConnection from '@/components/whatsapp/whatsapp-connection';
import {
    nuevoChat,
    contactos as obtenerContactos,
    sincronizar,
} from '@/actions/App/Http/Controllers/Admin/WhatsAppController';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Chat, EstadoTicketChat } from '@/pages/admin/whatsapp/index';

function formatearHoraChat(
    ultimoMensajeAt: string | null,
    horaUltimo: string,
): string {
    if (!ultimoMensajeAt) return horaUltimo;

    const fecha = new Date(ultimoMensajeAt);
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);

    const esHoy = fecha.toDateString() === hoy.toDateString();
    const esAyer = fecha.toDateString() === ayer.toDateString();

    if (esHoy) return horaUltimo;
    if (esAyer) return 'Ayer';
    return fecha.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
    });
}

function PreviewUltimoMensaje({ contenido }: { contenido: string }) {
    // Audio: [Audio] -> icono mic
    if (contenido === '[Audio]') {
        return (
            <span className="flex items-center gap-1">
                <Mic className="h-3 w-3 text-muted-foreground/70" />
                <span>Audio</span>
            </span>
        );
    }

    // Imagen: [Imagen] -> icono camara + "Foto"
    if (contenido === '[Imagen]') {
        return (
            <span className="flex items-center gap-1">
                <Camera className="h-3 w-3 text-muted-foreground/70" />
                <span>Foto</span>
            </span>
        );
    }

    // Video: [Video] -> icono video
    if (contenido === '[Video]') {
        return (
            <span className="flex items-center gap-1">
                <Video className="h-3 w-3 text-muted-foreground/70" />
                <span>Video</span>
            </span>
        );
    }

    // Sticker: [Sticker]
    if (contenido === '[Sticker]') {
        return <span>Sticker</span>;
    }

    // Documento: [Documento: filename]
    const docMatch = contenido.match(/^\[Documento:\s*(.+?)\]$/);
    if (docMatch) {
        return (
            <span className="flex items-center gap-1">
                <FileText className="h-3 w-3 text-muted-foreground/70" />
                <span className="truncate">{docMatch[1]}</span>
            </span>
        );
    }

    // Ubicacion: [Ubicación]
    if (contenido === '[Ubicación]') {
        return <span>Ubicacion</span>;
    }

    // Texto normal
    return <span className="truncate">{contenido}</span>;
}

type ContactoWhatsApp = {
    id: string | null;
    telefono: string;
    nombre: string;
    foto: string | null;
};

type FiltroEstado = 'todos' | EstadoTicketChat;

type Props = {
    chats: Chat[];
    chatActivo: string | null;
    onSelectChat: (id: string) => void;
    estadoConexion: 'desconectado' | 'conectando' | 'conectado';
    onEstadoCambiado?: (nuevoEstado: 'desconectado' | 'conectando' | 'conectado') => void;
};

const filtros: { valor: FiltroEstado; label: string }[] = [
    { valor: 'todos', label: 'Todos' },
    { valor: 'pendiente', label: 'Pendientes' },
    { valor: 'en_proceso', label: 'En proceso' },
    { valor: 'cerrado', label: 'Cerrados' },
];

export default function ChatList({
    chats,
    chatActivo,
    onSelectChat,
    estadoConexion,
    onEstadoCambiado,
}: Props) {
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
    const [dialogAbierto, setDialogAbierto] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [sincronizando, setSincronizando] = useState(false);

    // Estado para selector de contactos
    const [contactosWA, setContactosWA] = useState<ContactoWhatsApp[]>([]);
    const [cargandoContactos, setCargandoContactos] = useState(false);
    const [busquedaContacto, setBusquedaContacto] = useState('');
    const [contactoSeleccionado, setContactoSeleccionado] =
        useState<ContactoWhatsApp | null>(null);
    const [paso, setPaso] = useState<'seleccionar' | 'mensaje'>('seleccionar');

    const cargarContactos = () => {
        setCargandoContactos(true);
        const route = obtenerContactos();

        axios
            .get<ContactoWhatsApp[]>(route.url)
            .then((res) => {
                setContactosWA(res.data);
            })
            .catch((err) => console.error('Error al cargar contactos:', err))
            .finally(() => setCargandoContactos(false));
    };

    // Cargar contactos cuando se abre el dialog
    useEffect(() => {
        if (dialogAbierto && contactosWA.length === 0) {
            cargarContactos();
        }
    }, [dialogAbierto]);

    function handleSelectContacto(contacto: ContactoWhatsApp) {
        setContactoSeleccionado(contacto);
        setPaso('mensaje');
    }

    function handleVolverAContactos() {
        setContactoSeleccionado(null);
        setNuevoMensaje('');
        setPaso('seleccionar');
    }

    function handleCerrarDialog() {
        setDialogAbierto(false);
        setContactoSeleccionado(null);
        setNuevoMensaje('');
        setBusquedaContacto('');
        setPaso('seleccionar');
    }

    function handleEnviarMensaje() {
        if (!contactoSeleccionado || !nuevoMensaje.trim() || enviando) return;

        setEnviando(true);
        const route = nuevoChat();

        axios
            .post(route.url, {
                telefono: contactoSeleccionado.telefono,
                nombre: contactoSeleccionado.nombre,
                mensaje: nuevoMensaje.trim(),
            })
            .then((res) => {
                if (res.data.status === 'ok') {
                    handleCerrarDialog();
                    router.reload({ only: ['chats', 'mensajes'] });
                    if (res.data.contacto_id) {
                        onSelectChat(String(res.data.contacto_id));
                    }
                }
            })
            .catch((err) => console.error('Error al crear chat:', err))
            .finally(() => setEnviando(false));
    }

    function handleSincronizar() {
        if (sincronizando) return;

        setSincronizando(true);
        const route = sincronizar();

        axios
            .post(route.url)
            .then(() => {
                router.reload({ only: ['chats', 'mensajes'] });
            })
            .catch((err) => console.error('Error al sincronizar:', err))
            .finally(() => setSincronizando(false));
    }

    // Filtrar contactos por búsqueda
    const contactosFiltrados = contactosWA.filter(
        (c) =>
            c.nombre.toLowerCase().includes(busquedaContacto.toLowerCase()) ||
            c.telefono.includes(busquedaContacto),
    );

    const chatsFiltrados = chats.filter((chat) => {
        // Filtro por búsqueda
        const coincideBusqueda =
            chat.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            chat.telefono.includes(busqueda) ||
            chat.ultimo_mensaje.toLowerCase().includes(busqueda.toLowerCase());

        // Filtro por estado de ticket
        const coincideEstado =
            filtroEstado === 'todos' || chat.estado_ticket === filtroEstado;

        return coincideBusqueda && coincideEstado;
    });

    return (
        <div className="flex min-h-0 w-80 max-w-80 min-w-80 flex-col border-r bg-background">
            {/* Header con estado de conexión */}
            <div className="flex items-center justify-between border-b px-4 py-3">
                <span className="font-semibold">Chats</span>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Sincronizar chats"
                        onClick={handleSincronizar}
                        disabled={
                            sincronizando || estadoConexion !== 'conectado'
                        }
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${sincronizando ? 'animate-spin' : ''}`}
                        />
                    </Button>
                    <Dialog
                        open={dialogAbierto}
                        onOpenChange={(open) =>
                            open ? setDialogAbierto(true) : handleCerrarDialog()
                        }
                    >
                        <DialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Nuevo chat"
                            >
                                <MessageSquarePlus className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="flex max-h-[80vh] max-w-md flex-col">
                            <DialogHeader className="shrink-0">
                                {paso === 'seleccionar' ? (
                                    <>
                                        <DialogTitle>Nuevo chat</DialogTitle>
                                        <DialogDescription>
                                            Selecciona un contacto para iniciar
                                            una conversación.
                                        </DialogDescription>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={handleVolverAContactos}
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                        </Button>
                                        <div className="flex flex-1 items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                {contactoSeleccionado?.foto && (
                                                    <AvatarImage
                                                        src={
                                                            contactoSeleccionado.foto
                                                        }
                                                        alt={
                                                            contactoSeleccionado.nombre
                                                        }
                                                    />
                                                )}
                                                <AvatarFallback className="bg-primary/10 text-sm font-medium">
                                                    {contactoSeleccionado?.nombre
                                                        .split(' ')
                                                        .map((n) => n[0])
                                                        .join('')
                                                        .slice(0, 2)
                                                        .toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <DialogTitle className="text-base">
                                                    {
                                                        contactoSeleccionado?.nombre
                                                    }
                                                </DialogTitle>
                                                <p className="text-xs text-muted-foreground">
                                                    +
                                                    {
                                                        contactoSeleccionado?.telefono
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </DialogHeader>

                            {paso === 'seleccionar' ? (
                                <div className="flex min-h-0 flex-1 flex-col">
                                    {/* Búsqueda de contactos */}
                                    <div className="relative mb-3 shrink-0">
                                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar contacto..."
                                            value={busquedaContacto}
                                            onChange={(e) =>
                                                setBusquedaContacto(
                                                    e.target.value,
                                                )
                                            }
                                            className="pl-9"
                                        />
                                    </div>

                                    {/* Lista de contactos */}
                                    <div className="-mx-6 max-h-[400px] min-h-[300px] flex-1 overflow-y-auto px-6">
                                        {cargandoContactos ? (
                                            <div className="flex items-center justify-center py-12">
                                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                            </div>
                                        ) : contactosFiltrados.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                                <p className="text-sm">
                                                    {busquedaContacto
                                                        ? 'No se encontraron contactos'
                                                        : 'No hay contactos disponibles'}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                {contactosFiltrados.map(
                                                    (contacto) => (
                                                        <button
                                                            key={
                                                                contacto.telefono
                                                            }
                                                            onClick={() =>
                                                                handleSelectContacto(
                                                                    contacto,
                                                                )
                                                            }
                                                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent"
                                                        >
                                                            <Avatar className="h-10 w-10 shrink-0">
                                                                {contacto.foto && (
                                                                    <AvatarImage
                                                                        src={
                                                                            contacto.foto
                                                                        }
                                                                        alt={
                                                                            contacto.nombre
                                                                        }
                                                                    />
                                                                )}
                                                                <AvatarFallback className="bg-primary/10 text-sm font-medium">
                                                                    {contacto.nombre
                                                                        .split(
                                                                            ' ',
                                                                        )
                                                                        .map(
                                                                            (
                                                                                n,
                                                                            ) =>
                                                                                n[0],
                                                                        )
                                                                        .join(
                                                                            '',
                                                                        )
                                                                        .slice(
                                                                            0,
                                                                            2,
                                                                        )
                                                                        .toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-sm font-medium">
                                                                    {
                                                                        contacto.nombre
                                                                    }
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    +
                                                                    {
                                                                        contacto.telefono
                                                                    }
                                                                </p>
                                                            </div>
                                                        </button>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4 py-4">
                                    <Textarea
                                        placeholder="Escribe tu mensaje..."
                                        value={nuevoMensaje}
                                        onChange={(e) =>
                                            setNuevoMensaje(e.target.value)
                                        }
                                        rows={4}
                                        className="resize-none"
                                        autoFocus
                                    />
                                    <Button
                                        onClick={handleEnviarMensaje}
                                        disabled={
                                            !nuevoMensaje.trim() || enviando
                                        }
                                        className="w-full"
                                    >
                                        {enviando ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="mr-2 h-4 w-4" />
                                        )}
                                        Enviar mensaje
                                    </Button>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                    <WhatsAppConnection
                        estadoConexion={estadoConexion}
                        onEstadoCambiado={onEstadoCambiado}
                    />
                </div>
            </div>

            {/* Busqueda */}
            <div className="p-3 pb-0">
                <div className="relative">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Buscar chat..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Filtros por estado */}
            <div className="flex gap-1 overflow-x-auto p-3">
                {filtros.map((filtro) => (
                    <button
                        key={filtro.valor}
                        onClick={() => setFiltroEstado(filtro.valor)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${filtroEstado === filtro.valor
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                    >
                        {filtro.label}
                    </button>
                ))}
            </div>

            {/* Lista de chats */}
            <div className="flex-1 overflow-y-auto">
                {chatsFiltrados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        <p className="text-sm">No se encontraron chats</p>
                    </div>
                ) : (
                    chatsFiltrados.map((chat) => (
                        <button
                            key={chat.id}
                            onClick={() => onSelectChat(chat.id)}
                            className={`flex w-full items-center gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-accent ${chatActivo === chat.id ? 'bg-accent' : ''
                                }`}
                        >
                            <div className="relative shrink-0">
                                <Avatar className="h-12 w-12">
                                    {chat.avatar && (
                                        <AvatarImage
                                            src={chat.avatar}
                                            alt={chat.nombre}
                                        />
                                    )}
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
                                    className={`absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-background ${chat.en_linea
                                        ? 'bg-green-500'
                                        : 'bg-muted-foreground/40'
                                        }`}
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="truncate text-sm font-medium">
                                        {chat.nombre}
                                    </span>
                                    <span className="shrink-0 text-[11px] text-muted-foreground">
                                        {formatearHoraChat(
                                            chat.ultimo_mensaje_at,
                                            chat.hora_ultimo,
                                        )}
                                    </span>
                                </div>
                                <div className="mt-1 flex items-center justify-between gap-2">
                                    <p className="flex min-w-0 items-center truncate text-xs text-muted-foreground">
                                        <PreviewUltimoMensaje
                                            contenido={chat.ultimo_mensaje}
                                        />
                                    </p>
                                    {chat.no_leidos > 0 && (
                                        <Badge className="h-5 min-w-5 shrink-0 justify-center rounded-full px-1.5 text-[10px]">
                                            {chat.no_leidos}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
