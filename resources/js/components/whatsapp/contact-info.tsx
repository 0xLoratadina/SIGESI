import { Link } from '@inertiajs/react';
import { Phone, Plus, Ticket } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Chat, TicketResumen } from '@/pages/admin/whatsapp/index';

type Props = {
    chat: Chat;
    tickets: TicketResumen[];
};

const colorEstado: Record<string, string> = {
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    gray: 'bg-gray-500',
};

export default function ContactInfo({ chat, tickets }: Props) {
    return (
        <div className="flex min-h-0 w-72 max-w-72 min-w-72 flex-col border-l bg-background">
            {/* Info del contacto */}
            <div className="border-b p-6">
                <div className="flex flex-col items-center text-center">
                    <Avatar className="h-20 w-20">
                        {chat.avatar && (
                            <AvatarImage src={chat.avatar} alt={chat.nombre} />
                        )}
                        <AvatarFallback className="bg-primary/10 text-xl font-medium">
                            {chat.nombre
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <h3 className="mt-4 text-base font-semibold">
                        {chat.nombre}
                    </h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {chat.telefono}
                    </p>
                    <Badge
                        variant="outline"
                        className={`mt-3 ${chat.en_linea ? 'border-green-500 text-green-500' : ''}`}
                    >
                        {chat.en_linea ? 'En línea' : 'Desconectado'}
                    </Badge>
                </div>
            </div>

            {/* Acciones rapidas */}
            <div className="border-b p-4">
                <div className="flex justify-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        title="Llamar"
                    >
                        <Phone className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        title="Crear ticket"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Tickets asociados */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Tickets</span>
                    </div>
                    <Badge
                        variant="secondary"
                        className="flex h-5 min-w-5 items-center justify-center text-xs"
                    >
                        {tickets.length}
                    </Badge>
                </div>

                {tickets.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-4 text-center">
                        <p className="text-sm text-muted-foreground">
                            Sin tickets
                        </p>
                        <Button
                            variant="link"
                            size="sm"
                            className="mt-1 h-auto p-0"
                        >
                            <Plus className="mr-1 h-3 w-3" />
                            Crear ticket
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {tickets.map((ticket) => (
                            <Link
                                key={ticket.id}
                                href={`/admin/tickets/${ticket.id}`}
                                className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                            >
                                <div
                                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${colorEstado[ticket.color_estado] ?? 'bg-gray-500'}`}
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        {ticket.numero}
                                    </p>
                                    <p className="mt-0.5 truncate text-sm font-medium">
                                        {ticket.titulo}
                                    </p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {ticket.estado}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
