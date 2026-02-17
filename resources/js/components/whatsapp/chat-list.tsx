import { Search } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { Chat, EstadoTicketChat } from '@/pages/admin/whatsapp/index';

type FiltroEstado = 'todos' | EstadoTicketChat;

type Props = {
    chats: Chat[];
    chatActivo: string | null;
    onSelectChat: (id: string) => void;
    estadoConexion: 'desconectado' | 'conectando' | 'conectado';
};

const filtros: { valor: FiltroEstado; label: string }[] = [
    { valor: 'todos', label: 'Todos' },
    { valor: 'pendiente', label: 'Pendientes' },
    { valor: 'en_proceso', label: 'En proceso' },
    { valor: 'cerrado', label: 'Cerrados' },
];

export default function ChatList({ chats, chatActivo, onSelectChat, estadoConexion }: Props) {
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');

    const chatsFiltrados = chats.filter((chat) => {
        // Filtro por búsqueda
        const coincideBusqueda =
            chat.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            chat.telefono.includes(busqueda) ||
            chat.ultimo_mensaje.toLowerCase().includes(busqueda.toLowerCase());

        // Filtro por estado de ticket
        const coincideEstado = filtroEstado === 'todos' || chat.estado_ticket === filtroEstado;

        return coincideBusqueda && coincideEstado;
    });

    return (
        <div className="flex w-80 min-w-80 max-w-80 flex-col min-h-0 border-r bg-background">
            {/* Header con estado de conexión */}
            <div className="flex items-center justify-between border-b px-4 py-3">
                <span className="font-semibold">Chats</span>
                <div className="flex items-center gap-2">
                    <div
                        className={`h-2 w-2 rounded-full ${
                            estadoConexion === 'conectado'
                                ? 'bg-green-500'
                                : estadoConexion === 'conectando'
                                  ? 'bg-yellow-500 animate-pulse'
                                  : 'bg-red-500'
                        }`}
                    />
                    <span className="text-xs text-muted-foreground">
                        {estadoConexion === 'conectado'
                            ? 'Conectado'
                            : estadoConexion === 'conectando'
                              ? 'Conectando...'
                              : 'Desconectado'}
                    </span>
                </div>
            </div>

            {/* Busqueda */}
            <div className="p-3 pb-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Buscar chat..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Filtros por estado */}
            <div className="flex gap-1 p-3 overflow-x-auto scrollbar-thin">
                {filtros.map((filtro) => (
                    <button
                        key={filtro.valor}
                        onClick={() => setFiltroEstado(filtro.valor)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                            filtroEstado === filtro.valor
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
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
                            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent border-b border-border/50 ${
                                chatActivo === chat.id ? 'bg-accent' : ''
                            }`}
                        >
                            <div className="relative shrink-0">
                                <Avatar className="h-12 w-12">
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
                                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                                        chat.en_linea ? 'bg-green-500' : 'bg-muted-foreground/40'
                                    }`}
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="truncate font-medium text-sm">{chat.nombre}</span>
                                    <span className="shrink-0 text-[11px] text-muted-foreground">{chat.hora_ultimo}</span>
                                </div>
                                <div className="flex items-center justify-between gap-2 mt-1">
                                    <p className="truncate text-xs text-muted-foreground">{chat.ultimo_mensaje}</p>
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
