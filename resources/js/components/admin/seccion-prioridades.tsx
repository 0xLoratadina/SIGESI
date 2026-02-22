import { Form, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { store, update, destroy } from '@/actions/App/Http/Controllers/Admin/PrioridadController';
import DialogoConfirmacion from '@/components/dialogo-confirmacion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Prioridad } from '@/types';

type Props = {
    prioridades: Prioridad[];
};

export default function SeccionPrioridades({ prioridades }: Props) {
    const [abierto, setAbierto] = useState(false);
    const [editando, setEditando] = useState<Prioridad | null>(null);
    const [eliminando, setEliminando] = useState<Prioridad | null>(null);

    function abrirEdicion(pri: Prioridad) {
        setEditando(pri);
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
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">{prioridades.length} prioridad(es)</p>
                <Dialog open={abierto} onOpenChange={(v) => { if (!v) cerrar(); else setAbierto(true); }}>
                    <DialogTrigger asChild>
                        <Button size="sm" onClick={() => { setEditando(null); setAbierto(true); }}>
                            <Plus className="mr-1 h-4 w-4" /> Agregar
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editando ? 'Editar Prioridad' : 'Nueva Prioridad'}</DialogTitle>
                        </DialogHeader>
                        <Form
                            action={editando ? update.url(editando.id) : store.url()}
                            method={editando ? 'put' : 'post'}
                            options={{ preserveScroll: true, onSuccess: cerrar }}
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="nombre">Nombre *</Label>
                                                <Input id="nombre" name="nombre" defaultValue={editando?.nombre ?? ''} required />
                                                <InputError message={errors.nombre} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="color">Color *</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        id="color"
                                                        name="color"
                                                        type="color"
                                                        defaultValue={editando?.color ?? '#3B82F6'}
                                                        className="h-9 w-14 cursor-pointer p-1"
                                                        required
                                                    />
                                                    <Input
                                                        name="color"
                                                        defaultValue={editando?.color ?? '#3B82F6'}
                                                        placeholder="#3B82F6"
                                                        className="flex-1"
                                                        pattern="^#[0-9A-Fa-f]{6}$"
                                                        disabled
                                                    />
                                                </div>
                                                <InputError message={errors.color} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="nivel">Nivel *</Label>
                                                <Input id="nivel" name="nivel" type="number" min={1} defaultValue={editando?.nivel ?? ''} required />
                                                <InputError message={errors.nivel} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="horas_respuesta">Hrs. Respuesta *</Label>
                                                <Input id="horas_respuesta" name="horas_respuesta" type="number" min={1} defaultValue={editando?.horas_respuesta ?? ''} required />
                                                <InputError message={errors.horas_respuesta} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="horas_resolucion">Hrs. Resolución *</Label>
                                                <Input id="horas_resolucion" name="horas_resolucion" type="number" min={1} defaultValue={editando?.horas_resolucion ?? ''} required />
                                                <InputError message={errors.horas_resolucion} />
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
            </div>

            {prioridades.length === 0 ? (
                <div className="text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                    <p>No hay prioridades registradas.</p>
                    <p className="text-sm">Agrega una para comenzar.</p>
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nivel</TableHead>
                                <TableHead className="pl-[25px]">Nombre</TableHead>
                                <TableHead>Color</TableHead>
                                <TableHead className="hidden sm:table-cell">Hrs. Respuesta</TableHead>
                                <TableHead className="hidden sm:table-cell">Hrs. Resolución</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="w-[100px]">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {prioridades.map((pri) => (
                                <TableRow key={pri.id}>
                                    <TableCell>{pri.nivel}</TableCell>
                                    <TableCell className="pl-[25px] font-medium">{pri.nombre}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="inline-block h-4 w-4 rounded-full border" style={{ backgroundColor: pri.color }} />
                                            <span className="text-muted-foreground text-xs">{pri.color}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">{pri.horas_respuesta}h</TableCell>
                                    <TableCell className="hidden sm:table-cell">{pri.horas_resolucion}h</TableCell>
                                    <TableCell>
                                        <Badge variant={pri.activo ? 'default' : 'secondary'}>
                                            {pri.activo ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button size="icon" variant="ghost" onClick={() => abrirEdicion(pri)} title="Editar">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => setEliminando(pri)} title="Eliminar">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <DialogoConfirmacion
                abierto={!!eliminando}
                onCerrar={() => setEliminando(null)}
                onConfirmar={confirmarEliminar}
                titulo="Eliminar prioridad"
                descripcion={`¿Estás seguro de que deseas eliminar la prioridad "${eliminando?.nombre}"? Esta acción no se puede deshacer.`}
                textoConfirmar="Eliminar"
                variante="destructiva"
            />
        </div>
    );
}
