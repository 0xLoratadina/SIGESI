import { Form, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { store, update, destroy } from '@/actions/App/Http/Controllers/Admin/AreaController';
import DialogoConfirmacion from '@/components/dialogo-confirmacion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Area } from '@/types';

type Props = {
    areas: Area[];
    busqueda: string;
};

const PRIORIDAD_CONFIG: Record<number, { clase: string; etiqueta: string }> = {
    1: { clase: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', etiqueta: 'Muy alta' },
    2: { clase: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', etiqueta: 'Alta' },
    3: { clase: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', etiqueta: 'Media' },
    4: { clase: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200', etiqueta: 'Baja' },
    5: { clase: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200', etiqueta: 'Muy baja' },
};

function BadgePrioridad({ nivel }: { nivel: number }) {
    const config = PRIORIDAD_CONFIG[nivel] ?? PRIORIDAD_CONFIG[3];
    return (
        <Badge className={`inline-flex w-20 justify-center border-transparent ${config.clase}`}>
            {config.etiqueta}
        </Badge>
    );
}

const ALTURA_ENCABEZADO_EST = 41;
const ALTURA_FILA_EST = 49;
const POR_PAGINA_MOVIL = 10;

export type SeccionAreasRef = { abrirFormulario: () => void };

const SeccionAreas = forwardRef<SeccionAreasRef, Props>(function SeccionAreas({ areas, busqueda }, ref) {
    const [abierto, setAbierto] = useState(false);
    const [editando, setEditando] = useState<Area | null>(null);
    const [eliminando, setEliminando] = useState<Area | null>(null);
    const [pagina, setPagina] = useState(1);
    const contenedorRef = useRef<HTMLDivElement>(null);
    const [elementosPorPagina, setElementosPorPagina] = useState(POR_PAGINA_MOVIL);

    useImperativeHandle(ref, () => ({
        abrirFormulario() {
            setEditando(null);
            setAbierto(true);
        },
    }));

    const areasFiltradas = useMemo(() => {
        if (!busqueda.trim()) return areas;
        const termino = busqueda.toLowerCase().trim();
        return areas.filter((a) => a.nombre.toLowerCase().includes(termino));
    }, [areas, busqueda]);

    useEffect(() => {
        setPagina(1);
    }, [busqueda]);

    const hayDatos = areasFiltradas.length > 0;

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
            const altEnc = thead?.getBoundingClientRect().height ?? ALTURA_ENCABEZADO_EST;
            const altFila = fila?.getBoundingClientRect().height ?? ALTURA_FILA_EST;
            const filas = Math.max(1, Math.floor((el.clientHeight - altEnc) / altFila));
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

    const totalPaginas = Math.max(1, Math.ceil(areasFiltradas.length / elementosPorPagina));

    useEffect(() => {
        if (pagina > totalPaginas) setPagina(totalPaginas);
    }, [totalPaginas, pagina]);

    const areasPaginadas = useMemo(
        () => areasFiltradas.slice((pagina - 1) * elementosPorPagina, pagina * elementosPorPagina),
        [areasFiltradas, pagina, elementosPorPagina],
    );

    function abrirEdicion(area: Area) {
        setEditando(area);
        setAbierto(true);
    }

    function cerrar() {
        setAbierto(false);
        setEditando(null);
    }

    function confirmarEliminar() {
        if (!eliminando) return;
        router.delete(destroy.url(eliminando.id), {
            preserveScroll: true,
            onSuccess: () => setEliminando(null),
        });
    }

    return (
        <div className="flex flex-col md:min-h-0 md:flex-1">
            {areasFiltradas.length === 0 ? (
                <div className="text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                    <p>{busqueda.trim() ? 'No se encontraron areas que coincidan con la busqueda.' : 'No hay areas registradas.'}</p>
                    {!busqueda.trim() && <p className="text-sm">Agrega una para comenzar.</p>}
                </div>
            ) : (
                <>
                <div ref={contenedorRef} className="overflow-x-auto rounded-md border md:min-h-0 md:flex-1 md:overflow-hidden">
                    <Table className="min-w-[550px] table-fixed">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[30%] pl-[25px]">Nombre</TableHead>
                                <TableHead className="w-[25%]">Edificio</TableHead>
                                <TableHead className="w-[18%]">Prioridad</TableHead>
                                <TableHead className="w-[15%]">Estado</TableHead>
                                <TableHead className="w-[12%]">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {areasPaginadas.map((area) => (
                                <TableRow key={area.id}>
                                    <TableCell className="pl-[25px] font-medium">{area.nombre}</TableCell>
                                    <TableCell>{area.edificio ?? '--'}</TableCell>
                                    <TableCell>
                                        <BadgePrioridad nivel={area.nivel_prioridad} />
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={area.activo ? 'default' : 'secondary'}>
                                            {area.activo ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button size="icon" variant="ghost" onClick={() => abrirEdicion(area)} title="Editar">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => setEliminando(area)} title="Eliminar">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="shrink-0 flex items-center justify-between pt-2">
                    <p className="text-muted-foreground text-xs">
                        Mostrando {(pagina - 1) * elementosPorPagina + 1} a {Math.min(pagina * elementosPorPagina, areasFiltradas.length)} de {areasFiltradas.length}
                    </p>
                    <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {Array.from({ length: totalPaginas }, (_, i) => (
                            <Button key={i + 1} size="sm" variant={pagina === i + 1 ? 'default' : 'outline'} onClick={() => setPagina(i + 1)}>
                                {i + 1}
                            </Button>
                        ))}
                        <Button size="sm" variant="outline" disabled={pagina === totalPaginas} onClick={() => setPagina(pagina + 1)}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                </>
            )}

            <Dialog open={abierto} onOpenChange={(v) => { if (!v) cerrar(); else setAbierto(true); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editando ? 'Editar Area' : 'Nueva Area'}</DialogTitle>
                    </DialogHeader>
                    <Form
                        action={editando ? update.url(editando.id) : store.url()}
                        method={editando ? 'put' : 'post'}
                        options={{ preserveScroll: true, onSuccess: cerrar }}
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="nombre">Nombre *</Label>
                                        <Input id="nombre" name="nombre" defaultValue={editando?.nombre ?? ''} required />
                                        <InputError message={errors.nombre} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="edificio">Edificio</Label>
                                            <Input id="edificio" name="edificio" defaultValue={editando?.edificio ?? ''} />
                                            <InputError message={errors.edificio} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="nivel_prioridad">Nivel de prioridad *</Label>
                                            <Select name="nivel_prioridad" defaultValue={String(editando?.nivel_prioridad ?? '3')}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {[1, 2, 3, 4, 5].map((nivel) => (
                                                        <SelectItem key={nivel} value={String(nivel)}>
                                                            {nivel} {nivel === 1 ? '(Mas alta)' : nivel === 5 ? '(Mas baja)' : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.nivel_prioridad} />
                                        </div>
                                    </div>
                                    {editando && (
                                        <div className="flex items-center gap-2">
                                            <input type="hidden" name="activo" value="0" />
                                            <label className="flex items-center gap-2 text-sm">
                                                <input type="checkbox" name="activo" value="1" defaultChecked={editando.activo} />
                                                Activo
                                            </label>
                                        </div>
                                    )}
                                    <InputError message={errors.general} />
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={cerrar}>Cancelar</Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Guardando...' : 'Guardar'}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>

            <DialogoConfirmacion
                abierto={!!eliminando}
                onCerrar={() => setEliminando(null)}
                onConfirmar={confirmarEliminar}
                titulo="Eliminar area"
                descripcion={`¿Estas seguro de que deseas eliminar el area "${eliminando?.nombre}"? Esta accion no se puede deshacer.`}
                textoConfirmar="Eliminar"
                variante="destructiva"
            />
        </div>
    );
});

export default SeccionAreas;
