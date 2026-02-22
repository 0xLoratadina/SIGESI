import { Form, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { store, update, destroy } from '@/actions/App/Http/Controllers/Admin/CategoriaController';
import DialogoConfirmacion from '@/components/dialogo-confirmacion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import type { CategoriaConPadre } from '@/types';

type Props = {
    categorias: CategoriaConPadre[];
};

export default function SeccionCategorias({ categorias }: Props) {
    const [abierto, setAbierto] = useState(false);
    const [editando, setEditando] = useState<CategoriaConPadre | null>(null);
    const [eliminando, setEliminando] = useState<CategoriaConPadre | null>(null);

    const padres = categorias.filter((c) => !c.padre_id);

    function abrirEdicion(cat: CategoriaConPadre) {
        setEditando(cat);
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
                <p className="text-muted-foreground text-sm">{categorias.length} categoría(s)</p>
                <Dialog open={abierto} onOpenChange={(v) => { if (!v) cerrar(); else setAbierto(true); }}>
                    <DialogTrigger asChild>
                        <Button size="sm" onClick={() => { setEditando(null); setAbierto(true); }}>
                            <Plus className="mr-1 h-4 w-4" /> Agregar
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editando ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
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
                                            <Label htmlFor="descripcion">Descripción</Label>
                                            <Textarea id="descripcion" name="descripcion" defaultValue={editando?.descripcion ?? ''} rows={2} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Categoría padre</Label>
                                            <Select name="padre_id" defaultValue={editando?.padre_id?.toString() ?? ''}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Ninguna (categoría raíz)" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {padres
                                                        .filter((p) => p.id !== editando?.id)
                                                        .map((p) => (
                                                            <SelectItem key={p.id} value={p.id.toString()}>
                                                                {p.nombre}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.padre_id} />
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

            {categorias.length === 0 ? (
                <div className="text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                    <p>No hay categorías registradas.</p>
                    <p className="text-sm">Agrega una para comenzar.</p>
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-[25px]">Nombre</TableHead>
                                <TableHead>Padre</TableHead>
                                <TableHead className="hidden sm:table-cell">Descripción</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="w-[100px]">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categorias.map((cat) => (
                                <TableRow key={cat.id}>
                                    <TableCell className="pl-[25px] font-medium">
                                        {cat.padre_id && <span className="text-muted-foreground mr-1">↳</span>}
                                        {cat.nombre}
                                    </TableCell>
                                    <TableCell>{cat.padre?.nombre ?? '—'}</TableCell>
                                    <TableCell className="hidden max-w-[200px] truncate sm:table-cell">
                                        {cat.descripcion ?? '—'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={cat.activo ? 'default' : 'secondary'}>
                                            {cat.activo ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button size="icon" variant="ghost" onClick={() => abrirEdicion(cat)} title="Editar">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => setEliminando(cat)} title="Eliminar">
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
                titulo="Eliminar categoría"
                descripcion={`¿Estás seguro de que deseas eliminar la categoría "${eliminando?.nombre}"? Esta acción no se puede deshacer.`}
                textoConfirmar="Eliminar"
                variante="destructiva"
            />
        </div>
    );
}
