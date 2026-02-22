import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    TicketCheck,
    Inbox,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import ModalCrearTicket from '@/components/modal-crear-ticket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import {
    obtenerClaseEstado,
    obtenerEtiquetaEstado,
    formatearFecha,
    formatearFechaCorta,
} from '@/lib/ticket-helpers';
import { dashboard } from '@/routes';
import type {
    BreadcrumbItem,
    CatalogosDashboard,
    DatosPaginados,
    Estadisticas,
    EstadoTicket,
    Ticket,
} from '@/types';

type Props = {
    estadisticas: Estadisticas;
    tickets: DatosPaginados<Ticket>;
    filtroEstado: string | null;
    estados: EstadoTicket[];
    catalogos?: CatalogosDashboard;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Panel', href: dashboard().url },
];

function useEsMovil() {
    const [esMovil, setEsMovil] = useState(
        typeof window !== 'undefined' ? window.innerWidth < 768 : false,
    );

    useEffect(() => {
        const manejarResize = () => setEsMovil(window.innerWidth < 768);
        window.addEventListener('resize', manejarResize);
        return () => window.removeEventListener('resize', manejarResize);
    }, []);

    return esMovil;
}

export default function Dashboard({
    estadisticas,
    tickets,
    filtroEstado,
    estados,
    catalogos,
}: Props) {
    const esMovil = useEsMovil();

    const manejarFiltroEstado = (valor: string) => {
        const params: Record<string, string> = {};
        if (valor !== 'todos') params.estado = valor;
        if (esMovil) params.por_pagina = '10';
        router.get(dashboard().url, params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    useEffect(() => {
        const porPaginaActual = tickets.per_page;
        const porPaginaEsperada = esMovil ? 10 : 15;
        if (porPaginaActual !== porPaginaEsperada) {
            const params: Record<string, string> = {};
            if (filtroEstado) params.estado = filtroEstado;
            params.por_pagina = String(porPaginaEsperada);
            router.get(dashboard().url, params, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    }, [esMovil]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Panel" />

            <div className="flex min-w-0 flex-col gap-6 p-4 md:min-h-0 md:flex-1 md:p-6">
                {/* Tarjetas de estadisticas */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <TarjetaEstadistica
                        titulo="Total Tickets"
                        valor={estadisticas.total}
                        icono={
                            <TicketCheck className="size-5 text-muted-foreground" />
                        }
                    />
                    <TarjetaEstadistica
                        titulo="Abiertos"
                        valor={estadisticas.abiertos}
                        icono={<AlertCircle className="size-5 text-blue-500" />}
                    />
                    <TarjetaEstadistica
                        titulo="En Progreso"
                        valor={estadisticas.en_progreso}
                        icono={<Clock className="size-5 text-purple-500" />}
                    />
                    <TarjetaEstadistica
                        titulo="Resueltos"
                        valor={estadisticas.resueltos}
                        icono={
                            <CheckCircle2 className="size-5 text-green-500" />
                        }
                    />
                </div>

                {/* Filtro y tabla de tickets */}
                <Card className="flex min-w-0 flex-col overflow-hidden md:min-h-0 md:flex-1">
                    <CardHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-base font-medium">
                            Tickets recientes
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <ModalCrearTicket catalogos={catalogos} />
                            <Select
                                value={filtroEstado ?? 'todos'}
                                onValueChange={manejarFiltroEstado}
                            >
                                <SelectTrigger className="w-[140px] sm:w-[180px]">
                                    <SelectValue placeholder="Filtrar por estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos</SelectItem>
                                    {estados.map((estado) => (
                                        <SelectItem key={estado} value={estado}>
                                            {obtenerEtiquetaEstado(estado)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col md:min-h-0 md:flex-1">
                        {tickets.data.length > 0 ? (
                            <>
                                <div className="md:scrollbar-thin md:min-h-0 md:flex-1 md:overflow-y-scroll">
                                    <Table className="table-fixed">
                                        <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_var(--border)]">
                                            <TableRow>
                                                <TableHead className="hidden w-[9%] sm:table-cell">
                                                    #
                                                </TableHead>
                                                <TableHead className="w-[42%] sm:w-[30%]">
                                                    Titulo
                                                </TableHead>
                                                <TableHead className="w-[30%] sm:w-[10%]">
                                                    Estado
                                                </TableHead>
                                                <TableHead className="hidden w-[9%] sm:table-cell">
                                                    Prioridad
                                                </TableHead>
                                                <TableHead className="hidden w-[14%] md:table-cell">
                                                    Categoria
                                                </TableHead>
                                                <TableHead className="hidden w-[20%] lg:table-cell">
                                                    Solicitante
                                                </TableHead>
                                                <TableHead className="w-[28%] sm:w-[8%]">
                                                    Fecha
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {tickets.data.map((ticket) => (
                                                <TableRow key={ticket.id}>
                                                    <TableCell className="hidden font-mono text-xs sm:table-cell">
                                                        {ticket.numero}
                                                    </TableCell>
                                                    <TableCell className="truncate font-medium">
                                                        {ticket.titulo}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={`inline-flex w-[70px] items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium sm:w-[90px] sm:px-2.5 ${obtenerClaseEstado(ticket.estado)}`}
                                                        >
                                                            {obtenerEtiquetaEstado(
                                                                ticket.estado,
                                                            )}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="hidden sm:table-cell">
                                                        <span className="inline-flex items-center gap-1.5 text-xs">
                                                            <span
                                                                className="inline-block size-2 rounded-full"
                                                                style={{
                                                                    backgroundColor:
                                                                        ticket
                                                                            .prioridad
                                                                            ?.color,
                                                                }}
                                                            />
                                                            {
                                                                ticket.prioridad
                                                                    ?.nombre
                                                            }
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                                                        {
                                                            ticket.categoria
                                                                ?.nombre
                                                        }
                                                    </TableCell>
                                                    <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                                                        {
                                                            ticket.solicitante
                                                                ?.name
                                                        }
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        <span className="sm:hidden">
                                                            {formatearFechaCorta(
                                                                ticket.created_at,
                                                            )}
                                                        </span>
                                                        <span className="hidden sm:inline">
                                                            {formatearFecha(
                                                                ticket.created_at,
                                                            )}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Paginacion */}
                                {tickets.last_page > 1 && (
                                    <div className="mt-4 flex flex-col items-center gap-3 border-t pt-4 sm:flex-row sm:justify-between">
                                        <p className="text-xs text-muted-foreground sm:text-sm">
                                            Mostrando {tickets.from} a{' '}
                                            {tickets.to} de {tickets.total}
                                        </p>
                                        <div className="flex gap-1 sm:gap-2">
                                            {tickets.links.map(
                                                (enlace, indice) => {
                                                    const esPrevNext =
                                                        indice === 0 ||
                                                        indice ===
                                                            tickets.links
                                                                .length -
                                                                1;
                                                    return (
                                                        <Link
                                                            key={indice}
                                                            href={
                                                                enlace.url ??
                                                                '#'
                                                            }
                                                            preserveState
                                                            preserveScroll
                                                            className={`inline-flex h-8 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                                                                esPrevNext
                                                                    ? 'px-2 sm:px-3'
                                                                    : 'px-3'
                                                            } ${
                                                                enlace.active
                                                                    ? 'bg-primary text-primary-foreground'
                                                                    : enlace.url
                                                                      ? 'border hover:bg-accent'
                                                                      : 'pointer-events-none text-muted-foreground opacity-50'
                                                            }`}
                                                            dangerouslySetInnerHTML={{
                                                                __html: enlace.label,
                                                            }}
                                                        />
                                                    );
                                                },
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Inbox className="mb-3 size-10 opacity-40" />
                                <p className="text-sm">No hay tickets</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function TarjetaEstadistica({
    titulo,
    valor,
    icono,
}: {
    titulo: string;
    valor: number;
    icono: React.ReactNode;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {titulo}
                </CardTitle>
                {icono}
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{valor}</p>
            </CardContent>
        </Card>
    );
}
