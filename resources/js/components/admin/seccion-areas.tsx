import { Form, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { store, update, destroy } from '@/actions/App/Http/Controllers/Admin/AreaController';
import DialogoConfirmacion from '@/components/dialogo-confirmacion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Area } from '@/types';

type Props = {
    areas: Area[];
};

export default function SeccionAreas({ areas }: Props) {
    const [abierto, setAbierto] = useState(false);
    const [editando, setEditando] = useState<Area | null>(null);
    const [eliminando, setEliminando] = useState<Area | null>(null);

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
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">{areas.length} area(s)</p>
                <Dialog open={abierto} onOpenChange={(v) => { if (!v) cerrar(); else setAbierto(true); }}>
                    <DialogTrigger asChild>
                        <Button size="sm" onClick={() => { setEditando(null); setAbierto(true); }}>
                            <Plus className="mr-1 h-4 w-4" /> Agregar
                        </Button>
                    </DialogTrigger>
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
            </div>

            {areas.length === 0 ? (
                <div className="text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                    <p>No hay areas registradas.</p>
                    <p className="text-sm">Agrega una para comenzar.</p>
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead className="hidden sm:table-cell">Edificio</TableHead>
                                <TableHead>Nivel de prioridad</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="w-[100px]">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {areas.map((area) => (
                                <TableRow key={area.id}>
                                    <TableCell className="font-medium">{area.nombre}</TableCell>
                                    <TableCell className="hidden sm:table-cell">{area.edificio ?? '--'}</TableCell>
                                    <TableCell>{area.nivel_prioridad}</TableCell>
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
            )}

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
}
