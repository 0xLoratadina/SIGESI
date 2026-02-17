import { Head } from '@inertiajs/react';
import { useState } from 'react';
import ChatList from '@/components/whatsapp/chat-list';
import ChatWindow from '@/components/whatsapp/chat-window';
import ContactInfo from '@/components/whatsapp/contact-info';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { whatsapp } from '@/routes/admin';
import type { BreadcrumbItem } from '@/types';

export type EstadoTicketChat = 'sin_ticket' | 'pendiente' | 'en_proceso' | 'cerrado';

export type Chat = {
    id: string;
    nombre: string;
    telefono: string;
    avatar: string | null;
    ultimo_mensaje: string;
    hora_ultimo: string;
    no_leidos: number;
    en_linea: boolean;
    estado_ticket: EstadoTicketChat;
};

export type Mensaje = {
    id: string;
    tipo: 'recibido' | 'enviado';
    contenido: string;
    hora: string;
    leido: boolean;
    es_bot?: boolean;
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
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'WhatsApp', href: whatsapp().url }];

export default function WhatsAppInbox({ chats, mensajes, tickets, estadoConexion }: Props) {
    const [chatActivo, setChatActivo] = useState<string | null>(chats[0]?.id ?? null);
    const [mostrarInfo, setMostrarInfo] = useState(true);

    const chatSeleccionado = chats.find((c) => c.id === chatActivo);
    const mensajesChat = chatActivo ? mensajes[chatActivo] ?? [] : [];
    const ticketsChat = chatActivo ? tickets[chatActivo] ?? [] : [];

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
