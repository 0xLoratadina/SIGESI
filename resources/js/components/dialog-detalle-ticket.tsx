import { router } from '@inertiajs/react';
import {
    Calendar,
    Check,
    Loader2,
    MapPin,
    Paperclip,
    Save,
    Tag,
    User as UserIcon,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
    formatearFecha,
    obtenerClaseEstado,
    obtenerEtiquetaEstado,
} from '@/lib/ticket-helpers';
import type {
    CatalogosDashboard,
    EstadoTicket,
    TicketDetalle,
} from '@/types';

type Props = {
    ticketId: number | null;
    abierto: boolean;
    onCerrar: () => void;
    esAdmin: boolean;
    estados: EstadoTicket[];
    catalogos?: CatalogosDashboard;
};

function formatearTamano(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DialogDetalleTicket({
    ticketId,
    abierto,
    onCerrar,
    esAdmin,
    estados,
    catalogos,
}: Props) {
    const [ticket, setTicket] = useState<TicketDetalle | null>(null);
    const [cargando, setCargando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [guardadoExitoso, setGuardadoExitoso] = useState(false);

    // Campos editables (admin)
    const [estadoEdit, setEstadoEdit] = useState('');
    const [prioridadEdit, setPrioridadEdit] = useState('');
    const [auxiliarEdit, setAuxiliarEdit] = useState('');

    const cargarTicket = useCallback(async (id: number) => {
        setCargando(true);
        setTicket(null);
        try {
            const respuesta = await fetch(`/tickets/${id}`, {
                headers: { Accept: 'application/json' },
            });
            if (respuesta.ok) {
                const datos: TicketDetalle = await respuesta.json();
                setTicket(datos);
                setEstadoEdit(datos.estado);
                setPrioridadEdit(String(datos.prioridad_id));
                setAuxiliarEdit(
                    datos.auxiliar_id ? String(datos.auxiliar_id) : 'sin_asignar',
                );
            }
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        if (abierto && ticketId) {
            cargarTicket(ticketId);
            setGuardadoExitoso(false);
        }
        if (!abierto) {
            setTicket(null);
        }
    }, [abierto, ticketId, cargarTicket]);

    const hayCambios =
        ticket &&
        (estadoEdit !== ticket.estado ||
            prioridadEdit !== String(ticket.prioridad_id) ||
            auxiliarEdit !==
                (ticket.auxiliar_id
                    ? String(ticket.auxiliar_id)
                    : 'sin_asignar'));

    async function guardarCambios() {
        if (!ticket || !hayCambios) return;
        setGuardando(true);
        setGuardadoExitoso(false);

        const datos: Record<string, string | null> = {};
        if (estadoEdit !== ticket.estado) datos.estado = estadoEdit;
        if (prioridadEdit !== String(ticket.prioridad_id))
            datos.prioridad_id = prioridadEdit;
        if (
            auxiliarEdit !==
            (ticket.auxiliar_id ? String(ticket.auxiliar_id) : 'sin_asignar')
        ) {
            datos.auxiliar_id =
                auxiliarEdit === 'sin_asignar' ? null : auxiliarEdit;
        }

        try {
            const respuesta = await fetch(`/tickets/${ticket.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie
                            .split('; ')
                            .find((c) => c.startsWith('XSRF-TOKEN='))
                            ?.split('=')[1] ?? '',
                    ),
                },
                body: JSON.stringify(datos),
            });
            if (respuesta.ok) {
                const actualizado: TicketDetalle = await respuesta.json();
                setTicket(actualizado);
                setEstadoEdit(actualizado.estado);
                setPrioridadEdit(String(actualizado.prioridad_id));
                setAuxiliarEdit(
                    actualizado.auxiliar_id
                        ? String(actualizado.auxiliar_id)
                        : 'sin_asignar',
                );
                setGuardadoExitoso(true);
                setTimeout(() => setGuardadoExitoso(false), 2000);
                router.reload({ only: ['tickets', 'estadisticas'] });
            }
        } finally {
            setGuardando(false);
        }
    }

    return (
        <Dialog open={abierto} onOpenChange={(v) => !v && onCerrar()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                {cargando ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>
                                <Skeleton className="h-6 w-28" />
                            </DialogTitle>
                            <DialogDescription>
                                <Skeleton className="h-4 w-64" />
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-2">
                            <div className="grid grid-cols-2 gap-4">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <Skeleton className="h-3 w-16" />
                                        <Skeleton className="h-5 w-32" />
                                    </div>
                                ))}
                            </div>
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                    </>
                ) : ticket ? (
                    <>
                        <DialogHeader>
                            <div className="flex items-center gap-3">
                                <DialogTitle className="font-mono text-lg">
                                    {ticket.numero}
                                </DialogTitle>
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${obtenerClaseEstado(ticket.estado)}`}
                                >
                                    {obtenerEtiquetaEstado(ticket.estado)}
                                </span>
                            </div>
                            <DialogDescription className="text-left text-base font-medium text-foreground">
                                {ticket.titulo}
                            </DialogDescription>
                        </DialogHeader>

                        <Separator />

                        {/* Informacion del ticket */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                            <CampoDetalle
                                icono={<UserIcon className="size-3.5" />}
                                etiqueta="Solicitante"
                                valor={ticket.solicitante?.name}
                            />
                            <CampoDetalle
                                icono={<Tag className="size-3.5" />}
                                etiqueta="Area"
                                valor={ticket.area?.nombre}
                            />
                            <CampoDetalle
                                icono={<Tag className="size-3.5" />}
                                etiqueta="Categoria"
                                valor={ticket.categoria?.nombre}
                            />
                            <CampoDetalle
                                icono={<MapPin className="size-3.5" />}
                                etiqueta="Ubicacion"
                                valor={
                                    ticket.ubicacion
                                        ? `${ticket.ubicacion.nombre}${ticket.ubicacion.edificio ? ` - ${ticket.ubicacion.edificio}` : ''}`
                                        : 'Sin ubicacion'
                                }
                            />
                            <CampoDetalle
                                icono={<Calendar className="size-3.5" />}
                                etiqueta="Creado"
                                valor={formatearFecha(ticket.created_at)}
                            />
                            {ticket.fecha_limite && (
                                <CampoDetalle
                                    icono={<Calendar className="size-3.5" />}
                                    etiqueta="Fecha limite"
                                    valor={formatearFecha(ticket.fecha_limite)}
                                />
                            )}
                            {ticket.fecha_resolucion && (
                                <CampoDetalle
                                    icono={<Calendar className="size-3.5" />}
                                    etiqueta="Resuelto"
                                    valor={formatearFecha(
                                        ticket.fecha_resolucion,
                                    )}
                                />
                            )}
                        </div>

                        {/* Campos editables (solo admin) */}
                        {esAdmin && catalogos && (
                            <>
                                <Separator />
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium">
                                        Gestion
                                    </h4>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div className="space-y-1.5">
                                            <label className="text-xs text-muted-foreground">
                                                Estado
                                            </label>
                                            <Select
                                                value={estadoEdit}
                                                onValueChange={setEstadoEdit}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {estados.map((e) => (
                                                        <SelectItem
                                                            key={e}
                                                            value={e}
                                                        >
                                                            {obtenerEtiquetaEstado(
                                                                e,
                                                            )}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs text-muted-foreground">
                                                Prioridad
                                            </label>
                                            <Select
                                                value={prioridadEdit}
                                                onValueChange={
                                                    setPrioridadEdit
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {catalogos.prioridades.map(
                                                        (p) => (
                                                            <SelectItem
                                                                key={p.id}
                                                                value={String(
                                                                    p.id,
                                                                )}
                                                            >
                                                                <span className="flex items-center gap-2">
                                                                    <span
                                                                        className="inline-block size-2 rounded-full"
                                                                        style={{
                                                                            backgroundColor:
                                                                                p.color,
                                                                        }}
                                                                    />
                                                                    {p.nombre}
                                                                </span>
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs text-muted-foreground">
                                                Auxiliar
                                            </label>
                                            <Select
                                                value={auxiliarEdit}
                                                onValueChange={setAuxiliarEdit}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="sin_asignar">
                                                        Sin asignar
                                                    </SelectItem>
                                                    {catalogos.auxiliares.map(
                                                        (a) => (
                                                            <SelectItem
                                                                key={a.id}
                                                                value={String(
                                                                    a.id,
                                                                )}
                                                            >
                                                                {a.name}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Campos de solo lectura para no-admin */}
                        {!esAdmin && (
                            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                <CampoDetalle
                                    icono={<UserIcon className="size-3.5" />}
                                    etiqueta="Auxiliar"
                                    valor={
                                        ticket.auxiliar?.name ?? 'Sin asignar'
                                    }
                                />
                                <CampoDetalle
                                    icono={<Tag className="size-3.5" />}
                                    etiqueta="Prioridad"
                                    valor={
                                        ticket.prioridad ? (
                                            <span className="inline-flex items-center gap-1.5">
                                                <span
                                                    className="inline-block size-2 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            ticket.prioridad
                                                                .color,
                                                    }}
                                                />
                                                {ticket.prioridad.nombre}
                                            </span>
                                        ) : (
                                            '-'
                                        )
                                    }
                                />
                            </div>
                        )}

                        <Separator />

                        {/* Descripcion */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">Descripcion</h4>
                            <p className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                                {ticket.descripcion}
                            </p>
                        </div>

                        {/* Solucion */}
                        {ticket.solucion && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">
                                    Solucion
                                </h4>
                                <p className="whitespace-pre-wrap rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
                                    {ticket.solucion}
                                </p>
                            </div>
                        )}

                        {/* Adjuntos */}
                        {ticket.adjuntos && ticket.adjuntos.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">
                                    Adjuntos ({ticket.adjuntos.length})
                                </h4>
                                <div className="space-y-1.5">
                                    {ticket.adjuntos.map((adjunto) => (
                                        <div
                                            key={adjunto.id}
                                            className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                                        >
                                            <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                                            <span className="truncate">
                                                {adjunto.nombre}
                                            </span>
                                            <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                                                {formatearTamano(
                                                    adjunto.tamano,
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Footer con boton guardar (admin) */}
                        {esAdmin && (
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={onCerrar}
                                    disabled={guardando}
                                >
                                    Cerrar
                                </Button>
                                <Button
                                    onClick={guardarCambios}
                                    disabled={!hayCambios || guardando}
                                >
                                    {guardando ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : guardadoExitoso ? (
                                        <>
                                            <Check className="size-4" />
                                            Guardado
                                        </>
                                    ) : (
                                        <>
                                            <Save className="size-4" />
                                            Guardar cambios
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        )}
                    </>
                ) : (
                    <DialogHeader>
                        <DialogTitle>Detalle del ticket</DialogTitle>
                        <DialogDescription>
                            <span className="flex items-center gap-2">
                                <Loader2 className="size-4 animate-spin" />
                                Cargando...
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                )}
            </DialogContent>
        </Dialog>
    );
}

function CampoDetalle({
    icono,
    etiqueta,
    valor,
}: {
    icono: React.ReactNode;
    etiqueta: string;
    valor?: React.ReactNode;
}) {
    return (
        <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {icono}
                {etiqueta}
            </p>
            <p className="text-sm font-medium">{valor ?? '-'}</p>
        </div>
    );
}
