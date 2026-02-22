import { Form, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    store,
    update,
    destroy,
} from '@/actions/App/Http/Controllers/Admin/UbicacionController';
import DialogoConfirmacion from '@/components/dialogo-confirmacion';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Textarea } from '@/components/ui/textarea';
import type { Area, UbicacionConArea } from '@/types';

type Props = {
    ubicaciones: UbicacionConArea[];
    areas: Area[];
};

export default function SeccionUbicaciones({ ubicaciones, areas }: Props) {
    const [abierto, setAbierto] = useState(false);
    const [editando, setEditando] = useState<UbicacionConArea | null>(null);
    const [eliminando, setEliminando] = useState<UbicacionConArea | null>(null);

    function abrirEdicion(ubi: UbicacionConArea) {
        setEditando(ubi);
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
                <p className="text-sm text-muted-foreground">
                    {ubicaciones.length} ubicación(es)
                </p>
                <Dialog
                    open={abierto}
                    onOpenChange={(v) => {
                        if (!v) cerrar();
                        else setAbierto(true);
                    }}
                >
                    <DialogTrigger asChild>
                        <Button
                            size="sm"
                            onClick={() => {
                                setEditando(null);
                                setAbierto(true);
                            }}
                        >
                            <Plus className="mr-1 h-4 w-4" /> Agregar
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editando
                                    ? 'Editar Ubicación'
                                    : 'Nueva Ubicación'}
                            </DialogTitle>
                        </DialogHeader>
                        <Form
                            action={
                                editando ? update.url(editando.id) : store.url()
                            }
                            method={editando ? 'put' : 'post'}
                            options={{
                                preserveScroll: true,
                                onSuccess: cerrar,
                            }}
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="nombre">
                                                Nombre *
                                            </Label>
                                            <Input
                                                id="nombre"
                                                name="nombre"
                                                defaultValue={
                                                    editando?.nombre ?? ''
                                                }
                                                required
                                            />
                                            <InputError
                                                message={errors.nombre}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="edificio">
                                                    Edificio *
                                                </Label>
                                                <Input
                                                    id="edificio"
                                                    name="edificio"
                                                    defaultValue={
                                                        editando?.edificio ?? ''
                                                    }
                                                    required
                                                />
                                                <InputError
                                                    message={errors.edificio}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="piso">
                                                    Piso
                                                </Label>
                                                <Input
                                                    id="piso"
                                                    name="piso"
                                                    defaultValue={
                                                        editando?.piso ?? ''
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="salon">
                                                    Salón
                                                </Label>
                                                <Input
                                                    id="salon"
                                                    name="salon"
                                                    defaultValue={
                                                        editando?.salon ?? ''
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Área</Label>
                                                <Select
                                                    name="area_id"
                                                    defaultValue={
                                                        editando?.area_id?.toString() ??
                                                        ''
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Ninguna" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {areas.map((a) => (
                                                            <SelectItem
                                                                key={a.id}
                                                                value={a.id.toString()}
                                                            >
                                                                {a.nombre}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <InputError
                                                    message={errors.area_id}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="descripcion">
                                                Descripción
                                            </Label>
                                            <Textarea
                                                id="descripcion"
                                                name="descripcion"
                                                defaultValue={
                                                    editando?.descripcion ?? ''
                                                }
                                                rows={2}
                                            />
                                        </div>
                                        {editando && (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="hidden"
                                                    name="activo"
                                                    value="0"
                                                />
                                                <label className="flex items-center gap-2 text-sm">
                                                    <input
                                                        type="checkbox"
                                                        name="activo"
                                                        value="1"
                                                        defaultChecked={
                                                            editando.activo
                                                        }
                                                    />
                                                    Activo
                                                </label>
                                            </div>
                                        )}
                                        <InputError message={errors.general} />
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
                                            type="submit"
                                            disabled={processing}
                                        >
                                            {processing
                                                ? 'Guardando...'
                                                : 'Guardar'}
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {ubicaciones.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center text-muted-foreground">
                    <p>No hay ubicaciones registradas.</p>
                    <p className="text-sm">Agrega una para comenzar.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-md border">
                    <Table className="min-w-[500px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-[25px]">
                                    Nombre
                                </TableHead>
                                <TableHead>Edificio</TableHead>
                                <TableHead>Piso</TableHead>
                                <TableHead>Área</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="w-[80px]">
                                    Acciones
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ubicaciones.map((ubi) => (
                                <TableRow key={ubi.id}>
                                    <TableCell className="pl-[25px] font-medium">
                                        {ubi.nombre}
                                    </TableCell>
                                    <TableCell>{ubi.edificio}</TableCell>
                                    <TableCell>{ubi.piso ?? '—'}</TableCell>
                                    <TableCell>
                                        {ubi.area?.nombre ?? '—'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                ubi.activo
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {ubi.activo ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() =>
                                                    abrirEdicion(ubi)
                                                }
                                                title="Editar"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() =>
                                                    setEliminando(ubi)
                                                }
                                                title="Eliminar"
                                            >
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
                titulo="Eliminar ubicación"
                descripcion={`¿Estás seguro de que deseas eliminar la ubicación "${eliminando?.nombre}"? Esta acción no se puede deshacer.`}
                textoConfirmar="Eliminar"
                variante="destructiva"
            />
        </div>
    );
}
