import { router } from '@inertiajs/react';
import { Clock, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { update } from '@/actions/App/Http/Controllers/Admin/AuxiliarController';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usuarios } from '@/routes/admin';
import type { AuxiliarAdmin, Dia, HorarioAuxiliar } from '@/types/models';

const PLACEHOLDER_DIA = '__seleccionar__';

const DIAS: Dia[] = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
const ORDEN_DIA: Record<Dia, number> = { Lunes: 0, Martes: 1, Miercoles: 2, Jueves: 3, Viernes: 4, Sabado: 5, Domingo: 6 };
const DIAS_INICIALES: Record<Dia, string> = {
    Lunes: 'L',
    Martes: 'Ma',
    Miercoles: 'Mi',
    Jueves: 'J',
    Viernes: 'V',
    Sabado: 'S',
    Domingo: 'D',
};

type HorarioFormulario = {
    dia: Dia;
    hora_inicio: string;
    hora_fin: string;
};

type Props = {
    auxiliares: AuxiliarAdmin[];
};

export default function SeccionAuxiliares({ auxiliares }: Props) {
    const [abierto, setAbierto] = useState(false);
    const [editando, setEditando] = useState<AuxiliarAdmin | null>(null);
    const [procesando, setProcesando] = useState(false);
    const [errores, setErrores] = useState<Record<string, string>>({});

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
            [...prev, { dia: nuevoDia as Dia, hora_inicio: nuevaInicio, hora_fin: nuevaFin }]
                .sort((a, b) => ORDEN_DIA[a.dia] - ORDEN_DIA[b.dia]),
        );
        setNuevoDia(PLACEHOLDER_DIA);
        setNuevaInicio('08:00');
        setNuevaFin('16:00');
    }

    function quitarHorario(indice: number) {
        setHorarios((prev) => prev.filter((_, i) => i !== indice));
    }

    function editarHorario(indice: number, campo: keyof HorarioFormulario, valor: string) {
        setHorarios((prev) => prev.map((h, i) => (i === indice ? { ...h, [campo]: valor } : h)));
    }

    function guardar() {
        if (!editando) return;
        setProcesando(true);
        setErrores({});

        // Incluir horario pendiente en la fila de agregar y ordenar por día
        const horariosFinales = (nuevoDia !== PLACEHOLDER_DIA
            ? [...horarios, { dia: nuevoDia as Dia, hora_inicio: nuevaInicio, hora_fin: nuevaFin }]
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
        const diasUnicos = [...new Set(h.map((x) => x.dia))];
        return diasUnicos.map((d) => DIAS_INICIALES[d]).join(', ');
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">{auxiliares.length} auxiliar(es)</p>
                <Button size="sm" variant="outline" asChild>
                    <a href={usuarios().url + '?rol=Auxiliar'}>
                        <ExternalLink className="mr-1 h-4 w-4" /> Agregar desde Usuarios
                    </a>
                </Button>
            </div>

            {auxiliares.length === 0 ? (
                <div className="text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                    <p>No hay auxiliares registrados.</p>
                    <p className="text-sm">Crea un usuario con rol Auxiliar desde la seccion de Usuarios.</p>
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Teléfono</TableHead>
                                <TableHead className="hidden sm:table-cell">Especialidades</TableHead>
                                <TableHead className="hidden md:table-cell">Horario</TableHead>
                                <TableHead>Disponible</TableHead>
                                <TableHead className="w-[80px]">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {auxiliares.map((auxiliar) => (
                                <TableRow key={auxiliar.id}>
                                    <TableCell>
                                        <div>
                                            <span className="font-medium">{auxiliar.name}</span>
                                            {auxiliar.area && (
                                                <span className="text-muted-foreground ml-2 text-xs">({auxiliar.area.nombre})</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {auxiliar.whatsapp_telefono ?? '--'}
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        {auxiliar.especialidades ? (
                                            <span className="text-sm">{auxiliar.especialidades}</span>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">--</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <span className="text-muted-foreground text-sm">
                                            {resumenHorario(auxiliar.horarios_disponibilidad)}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={auxiliar.disponible ? 'default' : 'secondary'}>
                                            {auxiliar.disponible ? 'Si' : 'No'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Button size="icon" variant="ghost" onClick={() => abrirEdicion(auxiliar)} title="Editar">
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Dialog open={abierto} onOpenChange={(v) => { if (!v) cerrar(); }}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Editar Auxiliar: {editando?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="whatsapp_telefono">Teléfono</Label>
                            <Input
                                id="whatsapp_telefono"
                                value={whatsappTelefono}
                                onChange={(e) => setWhatsappTelefono(e.target.value)}
                                placeholder="Ej: 9221234567"
                                maxLength={20}
                            />
                            <InputError message={errores.whatsapp_telefono} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="especialidades">Especialidades</Label>
                            <Input
                                id="especialidades"
                                value={especialidades}
                                onChange={(e) => setEspecialidades(e.target.value)}
                                placeholder="Ej: redes, impresoras, servidores, software"
                                maxLength={500}
                            />
                            <p className="text-muted-foreground text-xs">
                                Texto libre que describe las areas de conocimiento del auxiliar.
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
                                    <div key={i} className="flex items-end gap-2">
                                        <div className="grid min-w-0 flex-1 gap-1">
                                            {i === 0 && <span className="text-muted-foreground text-xs">Dia</span>}
                                            <Select value={h.dia} onValueChange={(v) => editarHorario(i, 'dia', v)}>
                                                <SelectTrigger className="h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {/* Mostrar el dia actual + los disponibles */}
                                                    {DIAS.filter((d) => d === h.dia || !diasUsados.includes(d)).map((d) => (
                                                        <SelectItem key={d} value={d}>{d}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-1">
                                            {i === 0 && <span className="text-muted-foreground text-xs">Inicio</span>}
                                            <Input
                                                className="h-8 w-20 text-center font-mono text-sm"
                                                value={h.hora_inicio}
                                                onChange={(e) => editarHorario(i, 'hora_inicio', e.target.value)}
                                                placeholder="08:00"
                                                maxLength={5}
                                            />
                                        </div>
                                        <div className="grid gap-1">
                                            {i === 0 && <span className="text-muted-foreground text-xs">Fin</span>}
                                            <Input
                                                className="h-8 w-20 text-center font-mono text-sm"
                                                value={h.hora_fin}
                                                onChange={(e) => editarHorario(i, 'hora_fin', e.target.value)}
                                                placeholder="16:00"
                                                maxLength={5}
                                            />
                                        </div>
                                        <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => quitarHorario(i)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}

                                {/* Fila para agregar nuevo — solo si quedan dias disponibles */}
                                {diasDisponibles.length > 0 && (
                                    <div className="flex items-end gap-2">
                                        <div className="grid min-w-0 flex-1 gap-1">
                                            {horarios.length === 0 && <span className="text-muted-foreground text-xs">Dia</span>}
                                            <Select value={nuevoDia} onValueChange={setNuevoDia}>
                                                <SelectTrigger className="h-8">
                                                    <SelectValue placeholder="Seleccionar dia..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {diasDisponibles.map((d) => (
                                                        <SelectItem key={d} value={d}>{d}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-1">
                                            {horarios.length === 0 && <span className="text-muted-foreground text-xs">Inicio</span>}
                                            <Input
                                                className="h-8 w-20 text-center font-mono text-sm"
                                                value={nuevaInicio}
                                                onChange={(e) => setNuevaInicio(e.target.value)}
                                                placeholder="08:00"
                                                maxLength={5}
                                            />
                                        </div>
                                        <div className="grid gap-1">
                                            {horarios.length === 0 && <span className="text-muted-foreground text-xs">Fin</span>}
                                            <Input
                                                className="h-8 w-20 text-center font-mono text-sm"
                                                value={nuevaFin}
                                                onChange={(e) => setNuevaFin(e.target.value)}
                                                placeholder="16:00"
                                                maxLength={5}
                                            />
                                        </div>
                                        <Button type="button" size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={agregarHorario} title="Agregar horario" disabled={nuevoDia === PLACEHOLDER_DIA}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <InputError message={errores['horarios.0.hora_inicio'] || errores['horarios.0.hora_fin'] || errores['horarios.0.dia']} />
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox checked={disponible} onCheckedChange={(v) => setDisponible(v === true)} />
                                Disponible
                            </label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={cerrar}>
                            Cancelar
                        </Button>
                        <Button type="button" disabled={procesando} onClick={guardar}>
                            {procesando ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
