import { Form, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { store, update, destroy } from '@/actions/App/Http/Controllers/Admin/DepartamentoController';
import DialogoConfirmacion from '@/components/dialogo-confirmacion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Departamento } from '@/types';

type Props = {
    departamentos: Departamento[];
};

export default function SeccionDepartamentos({ departamentos }: Props) {
    const [abierto, setAbierto] = useState(false);
    const [editando, setEditando] = useState<Departamento | null>(null);
    const [eliminando, setEliminando] = useState<Departamento | null>(null);

    function abrirEdicion(depto: Departamento) {
        setEditando(depto);
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
                <p className="text-muted-foreground text-sm">{departamentos.length} departamento(s)</p>
                <Dialog open={abierto} onOpenChange={(v) => { if (!v) cerrar(); else setAbierto(true); }}>
                    <DialogTrigger asChild>
                        <Button size="sm" onClick={() => { setEditando(null); setAbierto(true); }}>
                            <Plus className="mr-1 h-4 w-4" /> Agregar
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editando ? 'Editar Departamento' : 'Nuevo Departamento'}</DialogTitle>
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
                                        <div className="grid gap-2">
                                            <Label htmlFor="codigo">Código *</Label>
                                            <Input id="codigo" name="codigo" defaultValue={editando?.codigo ?? ''} maxLength={10} required />
                                            <InputError message={errors.codigo} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="edificio">Edificio</Label>
                                                <Input id="edificio" name="edificio" defaultValue={editando?.edificio ?? ''} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="telefono">Teléfono</Label>
                                                <Input id="telefono" name="telefono" defaultValue={editando?.telefono ?? ''} />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="jefe">Jefe</Label>
                                            <Input id="jefe" name="jefe" defaultValue={editando?.jefe ?? ''} />
                                        </div>
                                        {editando && (
                                            <div className="flex items-center gap-2">
                                                <input type="hidden" name="activo" value={editando.activo ? '0' : '0'} />
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

            {departamentos.length === 0 ? (
                <div className="text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                    <p>No hay departamentos registrados.</p>
                    <p className="text-sm">Agrega uno para comenzar.</p>
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Código</TableHead>
                                <TableHead className="hidden sm:table-cell">Edificio</TableHead>
                                <TableHead className="hidden md:table-cell">Jefe</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="w-[100px]">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {departamentos.map((depto) => (
                                <TableRow key={depto.id}>
                                    <TableCell className="font-medium">{depto.nombre}</TableCell>
                                    <TableCell>{depto.codigo}</TableCell>
                                    <TableCell className="hidden sm:table-cell">{depto.edificio ?? '—'}</TableCell>
                                    <TableCell className="hidden md:table-cell">{depto.jefe ?? '—'}</TableCell>
                                    <TableCell>
                                        <Badge variant={depto.activo ? 'default' : 'secondary'}>
                                            {depto.activo ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button size="icon" variant="ghost" onClick={() => abrirEdicion(depto)} title="Editar">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => setEliminando(depto)} title="Eliminar">
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
                titulo="Eliminar departamento"
                descripcion={`¿Estás seguro de que deseas eliminar el departamento "${eliminando?.nombre}"? Esta acción no se puede deshacer.`}
                textoConfirmar="Eliminar"
                variante="destructiva"
            />
        </div>
    );
}
