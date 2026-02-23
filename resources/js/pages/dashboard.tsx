import { Head, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Ban,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Inbox,
    TicketCheck,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import DialogDetalleTicket from '@/components/dialog-detalle-ticket';
import ModalCrearTicket from '@/components/modal-crear-ticket';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    formatearFecha,
    formatearFechaCorta,
    obtenerClaseEstado,
    obtenerEtiquetaEstado,
} from '@/lib/ticket-helpers';
import { dashboard } from '@/routes';
import type {
    BreadcrumbItem,
    CatalogosDashboard,
    Estadisticas,
    EstadoTicket,
    SharedData,
    Ticket,
} from '@/types';

type TabFiltro = 'activos' | 'resueltos' | 'cancelados' | 'todos';

const ESTADOS_ACTIVOS: EstadoTicket[] = [
    'Abierto',
    'Asignado',
    'EnProgreso',
    'EnEspera',
];
const ESTADOS_RESUELTOS: EstadoTicket[] = ['Resuelto', 'Cerrado'];
const ESTADOS_CANCELADOS: EstadoTicket[] = ['Cancelado'];

type Props = {
    estadisticas: Estadisticas;
    tickets: Ticket[];
    filtroEstado: string | null;
    estados: EstadoTicket[];
    catalogos?: CatalogosDashboard;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Panel', href: dashboard().url },
];

const ALTURA_ENCABEZADO_EST = 41;
const ALTURA_FILA_EST = 49;
const POR_PAGINA_MOVIL = 10;

function obtenerTabInicial(filtroEstado: string | null): TabFiltro {
    if (!filtroEstado) return 'activos';
    if (ESTADOS_ACTIVOS.includes(filtroEstado as EstadoTicket)) return 'activos';
    if (ESTADOS_RESUELTOS.includes(filtroEstado as EstadoTicket))
        return 'resueltos';
    if (ESTADOS_CANCELADOS.includes(filtroEstado as EstadoTicket))
        return 'cancelados';
    return 'activos';
}

export default function Dashboard({
    estadisticas,
    tickets,
    filtroEstado,
    estados,
    catalogos,
}: Props) {
    const { auth } = usePage<SharedData>().props;
    const esAdmin = auth.user.rol === 'Administrador';

    const contenedorRef = useRef<HTMLDivElement>(null);
    const [elementosPorPagina, setElementosPorPagina] =
        useState(POR_PAGINA_MOVIL);
    const [pagina, setPagina] = useState(1);
    const [ticketSeleccionadoId, setTicketSeleccionadoId] = useState<
        number | null
    >(null);
    const [dialogAbierto, setDialogAbierto] = useState(false);
    const [tabActual, setTabActual] = useState<TabFiltro>(
        obtenerTabInicial(filtroEstado),
    );

    // Conteos por grupo
    const conteos = useMemo(() => {
        const activos = tickets.filter((t) =>
            ESTADOS_ACTIVOS.includes(t.estado),
        ).length;
        const resueltos = tickets.filter((t) =>
            ESTADOS_RESUELTOS.includes(t.estado),
        ).length;
        const cancelados = tickets.filter((t) =>
            ESTADOS_CANCELADOS.includes(t.estado),
        ).length;
        return { activos, resueltos, cancelados, todos: tickets.length };
    }, [tickets]);

    // Filtrar tickets segun tab
    const ticketsFiltrados = useMemo(() => {
        switch (tabActual) {
            case 'activos':
                return tickets.filter((t) =>
                    ESTADOS_ACTIVOS.includes(t.estado),
                );
            case 'resueltos':
                return tickets.filter((t) =>
                    ESTADOS_RESUELTOS.includes(t.estado),
                );
            case 'cancelados':
                return tickets.filter((t) =>
                    ESTADOS_CANCELADOS.includes(t.estado),
                );
            case 'todos':
                return tickets;
        }
    }, [tickets, tabActual]);

    function cambiarTab(tab: TabFiltro) {
        setTabActual(tab);
        setPagina(1);
    }

    const hayDatos = ticketsFiltrados.length > 0;

    useEffect(() => {
        if (!hayDatos) return;
        const el = contenedorRef.current;
        if (!el) return;
        const mq = window.matchMedia('(min-width: 768px)');

        function calcular() {
            if (!mq.matches) {
                setElementosPorPagina(POR_PAGINA_MOVIL);
                return;
            }
            const thead = el.querySelector('thead');
            const fila = el.querySelector('tbody tr');
            const altEnc =
                thead?.getBoundingClientRect().height ?? ALTURA_ENCABEZADO_EST;
            const altFila =
                fila?.getBoundingClientRect().height ?? ALTURA_FILA_EST;
            const filas = Math.max(
                1,
                Math.floor((el.clientHeight - altEnc) / altFila),
            );
            setElementosPorPagina(filas);
        }

        const observer = new ResizeObserver(calcular);
        observer.observe(el);
        mq.addEventListener('change', calcular);

        return () => {
            observer.disconnect();
            mq.removeEventListener('change', calcular);
        };
    }, [hayDatos]);

    const totalPaginas = Math.max(
        1,
        Math.ceil(ticketsFiltrados.length / elementosPorPagina),
    );

    useEffect(() => {
        if (pagina > totalPaginas) setPagina(totalPaginas);
    }, [totalPaginas, pagina]);

    const ticketsPaginados = useMemo(
        () =>
            ticketsFiltrados.slice(
                (pagina - 1) * elementosPorPagina,
                pagina * elementosPorPagina,
            ),
        [ticketsFiltrados, pagina, elementosPorPagina],
    );

    // Tabs disponibles
    const tabs: { id: TabFiltro; etiqueta: string; conteo: number }[] = [
        { id: 'activos', etiqueta: 'Activos', conteo: conteos.activos },
        { id: 'resueltos', etiqueta: 'Resueltos', conteo: conteos.resueltos },
        ...(conteos.cancelados > 0
            ? [
                  {
                      id: 'cancelados' as TabFiltro,
                      etiqueta: 'Cancelados',
                      conteo: conteos.cancelados,
                  },
              ]
            : []),
        { id: 'todos', etiqueta: 'Todos', conteo: conteos.todos },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Panel" />

            <div className="flex min-w-0 flex-col gap-6 p-4 md:min-h-0 md:flex-1 md:p-6">
                {/* Tarjetas de estadisticas (clickeables) */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <TarjetaEstadistica
                        titulo="Total Tickets"
                        valor={estadisticas.total}
                        icono={
                            <TicketCheck className="size-5 text-muted-foreground" />
                        }
                        activa={tabActual === 'todos'}
                        onClick={() => cambiarTab('todos')}
                    />
                    <TarjetaEstadistica
                        titulo="Abiertos"
                        valor={estadisticas.abiertos}
                        icono={<AlertCircle className="size-5 text-blue-500" />}
                        activa={tabActual === 'activos'}
                        onClick={() => cambiarTab('activos')}
                    />
                    <TarjetaEstadistica
                        titulo="En Progreso"
                        valor={estadisticas.en_progreso}
                        icono={<Clock className="size-5 text-purple-500" />}
                        activa={tabActual === 'activos'}
                        onClick={() => cambiarTab('activos')}
                    />
                    <TarjetaEstadistica
                        titulo="Resueltos"
                        valor={estadisticas.resueltos}
                        icono={
                            <CheckCircle2 className="size-5 text-green-500" />
                        }
                        activa={tabActual === 'resueltos'}
                        onClick={() => cambiarTab('resueltos')}
                    />
                </div>

                {/* Tabla de tickets con tabs */}
                <Card className="flex min-w-0 flex-col overflow-hidden md:min-h-0 md:flex-1">
                    <CardHeader className="shrink-0 space-y-0 pb-0">
                        <div className="flex items-center justify-between pb-4">
                            <CardTitle className="text-base font-medium">
                                Tickets
                            </CardTitle>
                            <ModalCrearTicket catalogos={catalogos} />
                        </div>
                        {/* Tabs de filtro */}
                        <div className="-mb-px flex gap-1 overflow-x-auto border-b">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => cambiarTab(tab.id)}
                                    className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium transition-colors ${
                                        tabActual === tab.id
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground'
                                    }`}
                                >
                                    {tab.id === 'activos' && (
                                        <Clock className="size-3.5" />
                                    )}
                                    {tab.id === 'resueltos' && (
                                        <CheckCircle2 className="size-3.5" />
                                    )}
                                    {tab.id === 'cancelados' && (
                                        <Ban className="size-3.5" />
                                    )}
                                    {tab.id === 'todos' && (
                                        <TicketCheck className="size-3.5" />
                                    )}
                                    {tab.etiqueta}
                                    <span
                                        className={`rounded-full px-1.5 py-0.5 text-xs ${
                                            tabActual === tab.id
                                                ? 'bg-primary/10 text-primary'
                                                : 'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        {tab.conteo}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col pt-4 md:min-h-0 md:flex-1">
                        {!hayDatos ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Inbox className="mb-3 size-10 opacity-40" />
                                <p className="text-sm">
                                    {tabActual === 'activos' &&
                                        'No hay tickets activos'}
                                    {tabActual === 'resueltos' &&
                                        'No hay tickets resueltos'}
                                    {tabActual === 'cancelados' &&
                                        'No hay tickets cancelados'}
                                    {tabActual === 'todos' && 'No hay tickets'}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div
                                    ref={contenedorRef}
                                    className="overflow-x-auto rounded-md border md:min-h-0 md:flex-1 md:overflow-hidden"
                                >
                                    <Table className="min-w-[700px] table-fixed">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="hidden w-[9%] pl-[25px] sm:table-cell">
                                                    #
                                                </TableHead>
                                                <TableHead className="w-[42%] pl-[25px] sm:w-[30%] sm:pl-0">
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
                                            {ticketsPaginados.map((ticket) => (
                                                <TableRow
                                                    key={ticket.id}
                                                    className="cursor-pointer"
                                                    onClick={() => {
                                                        setTicketSeleccionadoId(
                                                            ticket.id,
                                                        );
                                                        setDialogAbierto(true);
                                                    }}
                                                >
                                                    <TableCell className="hidden pl-[25px] font-mono text-xs sm:table-cell">
                                                        {ticket.numero}
                                                    </TableCell>
                                                    <TableCell className="truncate pl-[25px] font-medium sm:pl-4">
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
                                                    <TableCell className="hidden truncate text-sm text-muted-foreground md:table-cell">
                                                        {
                                                            ticket.categoria
                                                                ?.nombre
                                                        }
                                                    </TableCell>
                                                    <TableCell className="hidden truncate text-sm text-muted-foreground lg:table-cell">
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
                                <div className="flex shrink-0 items-center justify-between pt-2">
                                    <p className="text-xs text-muted-foreground">
                                        Mostrando{' '}
                                        {(pagina - 1) * elementosPorPagina + 1}{' '}
                                        a{' '}
                                        {Math.min(
                                            pagina * elementosPorPagina,
                                            ticketsFiltrados.length,
                                        )}{' '}
                                        de {ticketsFiltrados.length}
                                    </p>
                                    {totalPaginas > 1 && (
                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={pagina === 1}
                                                onClick={() =>
                                                    setPagina(pagina - 1)
                                                }
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            {Array.from(
                                                { length: totalPaginas },
                                                (_, i) => (
                                                    <Button
                                                        key={i + 1}
                                                        size="sm"
                                                        variant={
                                                            pagina === i + 1
                                                                ? 'default'
                                                                : 'outline'
                                                        }
                                                        onClick={() =>
                                                            setPagina(i + 1)
                                                        }
                                                    >
                                                        {i + 1}
                                                    </Button>
                                                ),
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={
                                                    pagina === totalPaginas
                                                }
                                                onClick={() =>
                                                    setPagina(pagina + 1)
                                                }
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <DialogDetalleTicket
                ticketId={ticketSeleccionadoId}
                abierto={dialogAbierto}
                onCerrar={() => setDialogAbierto(false)}
                esAdmin={esAdmin}
                estados={estados}
                catalogos={catalogos}
            />
        </AppLayout>
    );
}

function TarjetaEstadistica({
    titulo,
    valor,
    icono,
    activa,
    onClick,
}: {
    titulo: string;
    valor: number;
    icono: React.ReactNode;
    activa?: boolean;
    onClick?: () => void;
}) {
    return (
        <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
                activa
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                    : 'hover:border-primary/30'
            }`}
            onClick={onClick}
        >
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
