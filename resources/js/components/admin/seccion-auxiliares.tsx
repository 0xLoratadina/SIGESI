import { router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { update } from '@/actions/App/Http/Controllers/Admin/AuxiliarController';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import type { AuxiliarAdmin, Dia, HorarioAuxiliar } from '@/types/models';

const PLACEHOLDER_DIA = '__seleccionar__';

const DIAS: Dia[] = [
    'Lunes',
    'Martes',
    'Miercoles',
    'Jueves',
    'Viernes',
    'Sabado',
    'Domingo',
];
const ORDEN_DIA: Record<Dia, number> = {
    Lunes: 0,
    Martes: 1,
    Miercoles: 2,
    Jueves: 3,
    Viernes: 4,
    Sabado: 5,
    Domingo: 6,
};
const DIAS_ABREVIADOS: Record<Dia, string> = {
    Lunes: 'Lun',
    Martes: 'Mar',
    Miercoles: 'Mié',
    Jueves: 'Jue',
    Viernes: 'Vie',
    Sabado: 'Sáb',
    Domingo: 'Dom',
};

type HorarioFormulario = {
    dia: Dia;
    hora_inicio: string;
    hora_fin: string;
};

type Props = {
    auxiliares: AuxiliarAdmin[];
    busqueda: string;
};

const ALTURA_ENCABEZADO_EST = 41;
const ALTURA_FILA_EST = 49;
const POR_PAGINA_MOVIL = 10;

export default function SeccionAuxiliares({ auxiliares, busqueda }: Props) {
    const [abierto, setAbierto] = useState(false);
    const [editando, setEditando] = useState<AuxiliarAdmin | null>(null);
    const [procesando, setProcesando] = useState(false);
    const [errores, setErrores] = useState<Record<string, string>>({});
    const [pagina, setPagina] = useState(1);
    const contenedorRef = useRef<HTMLDivElement>(null);
    const [elementosPorPagina, setElementosPorPagina] =
        useState(POR_PAGINA_MOVIL);

    const auxiliaresFiltrados = useMemo(() => {
        if (!busqueda.trim()) return auxiliares;
        const termino = busqueda.toLowerCase().trim();
        return auxiliares.filter((a) => a.name.toLowerCase().includes(termino));
    }, [auxiliares, busqueda]);

    useEffect(() => {
        setPagina(1);
    }, [busqueda]);

    const hayDatos = auxiliaresFiltrados.length > 0;

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
        Math.ceil(auxiliaresFiltrados.length / elementosPorPagina),
    );

    useEffect(() => {
        if (pagina > totalPaginas) setPagina(totalPaginas);
    }, [totalPaginas, pagina]);

    const auxiliaresPaginados = useMemo(
        () =>
            auxiliaresFiltrados.slice(
                (pagina - 1) * elementosPorPagina,
                pagina * elementosPorPagina,
            ),
        [auxiliaresFiltrados, pagina, elementosPorPagina],
    );

    const [whatsappTelefono, setWhatsappTelefono] = useState('');
    const [especialidades, setEspecialidades] = useState('');
    const [disponible, setDisponible] = useState(true);
    const [horarios, setHorarios] = useState<HorarioFormulario[]>([]);

    // ── Horario temporal para agregar ──────────────────────────
    const [nuevoDia, setNuevoDia] = useState<string>(PLACEHOLDER_DIA);
    const [nuevaInicio, setNuevaInicio] = useState('08:00');
    const [nuevaFin, setNuevaFin] = useState('16:00');

    const diasUsados = horarios.map((h) => h.dia);
    const diasDisponibles = DIAS.filter((d) => !diasUsados.includes(d));

    function abrirEdicion(auxiliar: AuxiliarAdmin) {
        setEditando(auxiliar);
        setWhatsappTelefono(auxiliar.whatsapp_telefono ?? '');
        setEspecialidades(auxiliar.especialidades ?? '');
        setDisponible(auxiliar.disponible);
        setHorarios(
            (auxiliar.horarios_disponibilidad ?? [])
                .map((h) => ({
                    dia: h.dia,
                    hora_inicio: h.hora_inicio.substring(0, 5),
                    hora_fin: h.hora_fin.substring(0, 5),
                }))
                .sort((a, b) => ORDEN_DIA[a.dia] - ORDEN_DIA[b.dia]),
        );
        setErrores({});
        setNuevoDia(PLACEHOLDER_DIA);
        setNuevaInicio('08:00');
        setNuevaFin('16:00');
        setAbierto(true);
    }

    function cerrar() {
        setAbierto(false);
        setEditando(null);
    }

    function agregarHorario() {
        if (nuevoDia === PLACEHOLDER_DIA) return;
        setHorarios((prev) =>
            [
                ...prev,
                {
                    dia: nuevoDia as Dia,
                    hora_inicio: nuevaInicio,
                    hora_fin: nuevaFin,
                },
            ].sort((a, b) => ORDEN_DIA[a.dia] - ORDEN_DIA[b.dia]),
        );
        setNuevoDia(PLACEHOLDER_DIA);
        setNuevaInicio('08:00');
        setNuevaFin('16:00');
    }

    function quitarHorario(indice: number) {
        setHorarios((prev) => prev.filter((_, i) => i !== indice));
    }

    function editarHorario(
        indice: number,
        campo: keyof HorarioFormulario,
        valor: string,
    ) {
        setHorarios((prev) =>
            prev.map((h, i) => (i === indice ? { ...h, [campo]: valor } : h)),
        );
    }

    function guardar() {
        if (!editando) return;
        setProcesando(true);
        setErrores({});

        // Incluir horario pendiente en la fila de agregar y ordenar por día
        const horariosFinales = (
            nuevoDia !== PLACEHOLDER_DIA
                ? [
                      ...horarios,
                      {
                          dia: nuevoDia as Dia,
                          hora_inicio: nuevaInicio,
                          hora_fin: nuevaFin,
                      },
                  ]
                : [...horarios]
        ).sort((a, b) => ORDEN_DIA[a.dia] - ORDEN_DIA[b.dia]);

        router.put(
            update.url(editando.id),
            {
                whatsapp_telefono: whatsappTelefono || null,
                especialidades: especialidades || null,
                disponible,
                horarios: horariosFinales,
            },
            {
                preserveScroll: true,
                onSuccess: () => cerrar(),
                onError: (e) => setErrores(e),
                onFinish: () => setProcesando(false),
            },
        );
    }

    function resumenHorario(h?: HorarioAuxiliar[]) {
        if (!h || h.length === 0) return '--';

        const diasUnicos = [...new Set(h.map((x) => x.dia))].sort(
            (a, b) => ORDEN_DIA[a] - ORDEN_DIA[b],
        );
        const indices = diasUnicos.map((d) => ORDEN_DIA[d]);

        // Detectar si todos tienen el mismo horario para mostrarlo
        const inicios = h.map((x) => x.hora_inicio.substring(0, 5));
        const fines = h.map((x) => x.hora_fin.substring(0, 5));
        const mismoHorario =
            inicios.every((v) => v === inicios[0]) &&
            fines.every((v) => v === fines[0]);
        const sufijo = mismoHorario ? ` (${inicios[0]} - ${fines[0]})` : '';

        // Verificar si son dias consecutivos
        const sonConsecutivos = indices.every(
            (val, i) => i === 0 || val === indices[i - 1] + 1,
        );

        if (diasUnicos.length === 7) {
            return `Todos los días${sufijo}`;
        }

        if (sonConsecutivos && diasUnicos.length >= 2) {
            // Lun-Vie o Lun-Sáb son los rangos mas comunes
            const primero = DIAS_ABREVIADOS[diasUnicos[0]];
            const ultimo = DIAS_ABREVIADOS[diasUnicos[diasUnicos.length - 1]];
            return `${primero} - ${ultimo}${sufijo}`;
        }

        return diasUnicos.map((d) => DIAS_ABREVIADOS[d]).join(', ') + sufijo;
    }

    return (
        <div className="flex flex-col md:min-h-0 md:flex-1">
            {auxiliaresFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center text-muted-foreground">
                    <p>
                        {busqueda.trim()
                            ? 'No se encontraron auxiliares que coincidan con la busqueda.'
                            : 'No hay auxiliares registrados.'}
                    </p>
                    {!busqueda.trim() && (
                        <p className="text-sm">
                            Crea un usuario con rol Auxiliar desde la seccion de
                            Usuarios.
                        </p>
                    )}
                </div>
            ) : (
                <>
                    <div
                        ref={contenedorRef}
                        className="overflow-x-auto rounded-md border md:min-h-0 md:flex-1 md:overflow-hidden"
                    >
                        <Table className="min-w-[650px] table-fixed">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[22%] pl-[25px]">
                                        Nombre
                                    </TableHead>
                                    <TableHead className="w-[15%]">
                                        Teléfono
                                    </TableHead>
                                    <TableHead className="w-[20%]">
                                        Especialidades
                                    </TableHead>
                                    <TableHead className="w-[22%]">
                                        Horario
                                    </TableHead>
                                    <TableHead className="w-[12%]">
                                        Disponible
                                    </TableHead>
                                    <TableHead className="w-[9%]">
                                        Acciones
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {auxiliaresPaginados.map((auxiliar) => (
                                    <TableRow key={auxiliar.id}>
                                        <TableCell className="pl-[25px]">
                                            <div>
                                                <span className="font-medium">
                                                    {auxiliar.name}
                                                </span>
                                                {auxiliar.area && (
                                                    <span className="ml-2 text-xs text-muted-foreground">
                                                        ({auxiliar.area.nombre})
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {auxiliar.whatsapp_telefono ?? '--'}
                                        </TableCell>
                                        <TableCell>
                                            {auxiliar.especialidades ? (
                                                <span
                                                    className="max-w-[200px] truncate text-sm"
                                                    title={
                                                        auxiliar.especialidades
                                                    }
                                                >
                                                    {auxiliar.especialidades}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">
                                                    --
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">
                                                {resumenHorario(
                                                    auxiliar.horarios_disponibilidad,
                                                )}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    auxiliar.disponible
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {auxiliar.disponible
                                                    ? 'Si'
                                                    : 'No'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() =>
                                                    abrirEdicion(auxiliar)
                                                }
                                                title="Editar"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex shrink-0 items-center justify-between pt-2">
                        <p className="text-xs text-muted-foreground">
                            Mostrando {(pagina - 1) * elementosPorPagina + 1} a{' '}
                            {Math.min(
                                pagina * elementosPorPagina,
                                auxiliaresFiltrados.length,
                            )}{' '}
                            de {auxiliaresFiltrados.length}
                        </p>
                        <div className="flex items-center gap-1">
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={pagina === 1}
                                onClick={() => setPagina(pagina - 1)}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {Array.from({ length: totalPaginas }, (_, i) => (
                                <Button
                                    key={i + 1}
                                    size="sm"
                                    variant={
                                        pagina === i + 1 ? 'default' : 'outline'
                                    }
                                    onClick={() => setPagina(i + 1)}
                                >
                                    {i + 1}
                                </Button>
                            ))}
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={pagina === totalPaginas}
                                onClick={() => setPagina(pagina + 1)}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </>
            )}

            <Dialog
                open={abierto}
                onOpenChange={(v) => {
                    if (!v) cerrar();
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            Editar Auxiliar: {editando?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="whatsapp_telefono">Teléfono</Label>
                            <Input
                                id="whatsapp_telefono"
                                value={whatsappTelefono}
                                onChange={(e) =>
                                    setWhatsappTelefono(e.target.value)
                                }
                                placeholder="Ej: 9221234567"
                                maxLength={20}
                            />
                            <InputError message={errores.whatsapp_telefono} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="especialidades">
                                Especialidades
                            </Label>
                            <Input
                                id="especialidades"
                                value={especialidades}
                                onChange={(e) =>
                                    setEspecialidades(e.target.value)
                                }
                                placeholder="Ej: redes, impresoras, servidores, software"
                                maxLength={500}
                            />
                            <p className="text-xs text-muted-foreground">
                                Texto libre que describe las areas de
                                conocimiento del auxiliar.
                            </p>
                            <InputError message={errores.especialidades} />
                        </div>

                        {/* Editor de horarios */}
                        <div className="grid gap-2">
                            <Label className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                Horarios de disponibilidad
                            </Label>
                            <div className="space-y-2">
                                {/* Filas existentes — editables */}
                                {horarios.map((h, i) => (
                                    <div
                                        key={i}
                                        className="flex items-end gap-2"
                                    >
                                        <div className="grid min-w-0 flex-1 gap-1">
                                            {i === 0 && (
                                                <span className="text-xs text-muted-foreground">
                                                    Dia
                                                </span>
                                            )}
                                            <Select
                                                value={h.dia}
                                                onValueChange={(v) =>
                                                    editarHorario(i, 'dia', v)
                                                }
                                            >
                                                <SelectTrigger className="h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {/* Mostrar el dia actual + los disponibles */}
                                                    {DIAS.filter(
                                                        (d) =>
                                                            d === h.dia ||
                                                            !diasUsados.includes(
                                                                d,
                                                            ),
                                                    ).map((d) => (
                                                        <SelectItem
                                                            key={d}
                                                            value={d}
                                                        >
                                                            {d}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-1">
                                            {i === 0 && (
                                                <span className="text-xs text-muted-foreground">
                                                    Inicio
                                                </span>
                                            )}
                                            <Input
                                                className="h-8 w-20 text-center font-mono text-sm"
                                                value={h.hora_inicio}
                                                onChange={(e) =>
                                                    editarHorario(
                                                        i,
                                                        'hora_inicio',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="08:00"
                                                maxLength={5}
                                            />
                                        </div>
                                        <div className="grid gap-1">
                                            {i === 0 && (
                                                <span className="text-xs text-muted-foreground">
                                                    Fin
                                                </span>
                                            )}
                                            <Input
                                                className="h-8 w-20 text-center font-mono text-sm"
                                                value={h.hora_fin}
                                                onChange={(e) =>
                                                    editarHorario(
                                                        i,
                                                        'hora_fin',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="16:00"
                                                maxLength={5}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 shrink-0"
                                            onClick={() => quitarHorario(i)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}

                                {/* Fila para agregar nuevo — solo si quedan dias disponibles */}
                                {diasDisponibles.length > 0 && (
                                    <div className="flex items-end gap-2">
                                        <div className="grid min-w-0 flex-1 gap-1">
                                            {horarios.length === 0 && (
                                                <span className="text-xs text-muted-foreground">
                                                    Dia
                                                </span>
                                            )}
                                            <Select
                                                value={nuevoDia}
                                                onValueChange={setNuevoDia}
                                            >
                                                <SelectTrigger className="h-8">
                                                    <SelectValue placeholder="Seleccionar dia..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {diasDisponibles.map(
                                                        (d) => (
                                                            <SelectItem
                                                                key={d}
                                                                value={d}
                                                            >
                                                                {d}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-1">
                                            {horarios.length === 0 && (
                                                <span className="text-xs text-muted-foreground">
                                                    Inicio
                                                </span>
                                            )}
                                            <Input
                                                className="h-8 w-20 text-center font-mono text-sm"
                                                value={nuevaInicio}
                                                onChange={(e) =>
                                                    setNuevaInicio(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="08:00"
                                                maxLength={5}
                                            />
                                        </div>
                                        <div className="grid gap-1">
                                            {horarios.length === 0 && (
                                                <span className="text-xs text-muted-foreground">
                                                    Fin
                                                </span>
                                            )}
                                            <Input
                                                className="h-8 w-20 text-center font-mono text-sm"
                                                value={nuevaFin}
                                                onChange={(e) =>
                                                    setNuevaFin(e.target.value)
                                                }
                                                placeholder="16:00"
                                                maxLength={5}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="outline"
                                            className="h-8 w-8 shrink-0"
                                            onClick={agregarHorario}
                                            title="Agregar horario"
                                            disabled={
                                                nuevoDia === PLACEHOLDER_DIA
                                            }
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <InputError
                                message={
                                    errores['horarios.0.hora_inicio'] ||
                                    errores['horarios.0.hora_fin'] ||
                                    errores['horarios.0.dia']
                                }
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={disponible}
                                    onCheckedChange={(v) =>
                                        setDisponible(v === true)
                                    }
                                />
                                Disponible
                            </label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={cerrar}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            disabled={procesando}
                            onClick={guardar}
                        >
                            {procesando ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
