import { useForm, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { store } from '@/actions/App/Http/Controllers/TicketController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import ZonaAdjuntos from '@/components/zona-adjuntos';
import type { CatalogosDashboard, SharedData } from '@/types';

type Props = {
    catalogos?: CatalogosDashboard;
};

export default function ModalCrearTicket({ catalogos }: Props) {
    const { auth } = usePage<SharedData>().props;
    const [abierto, setAbierto] = useState(false);
    const [adjuntos, setAdjuntos] = useState<File[]>([]);
    const esAdmin = auth.user.rol === 'Administrador';
    const esSolicitante = auth.user.rol === 'Solicitante';

    const prioridadMedia = catalogos?.prioridades.find((p) => p.nivel === 3);

    const { data, setData, post, processing, errors, reset, progress, transform } = useForm({
        titulo: '',
        descripcion: '',
        area_id: '',
        categoria_id: '',
        prioridad_id: prioridadMedia ? String(prioridadMedia.id) : '',
        solicitante_id: '',
    });

    useEffect(() => {
        if (abierto && prioridadMedia && !data.prioridad_id) {
            setData('prioridad_id', String(prioridadMedia.id));
        }
    }, [abierto, prioridadMedia]);

    const categoriasPadre =
        catalogos?.categorias.filter((c) => !c.padre_id) ?? [];
    const categoriasHijas =
        catalogos?.categorias.filter((c) => c.padre_id) ?? [];

    function enviarFormulario(e: FormEvent) {
        e.preventDefault();

        transform((formData) => {
            const payload: Record<string, unknown> = {
                titulo: formData.titulo,
                descripcion: formData.descripcion,
            };

            if (!esSolicitante) {
                if (formData.area_id) payload.area_id = formData.area_id;
                if (formData.categoria_id) payload.categoria_id = formData.categoria_id;
                if (formData.prioridad_id) payload.prioridad_id = formData.prioridad_id;
            }

            if (esAdmin && formData.solicitante_id) {
                payload.solicitante_id = formData.solicitante_id;
            }

            if (adjuntos.length > 0) {
                payload.adjuntos = adjuntos;
            }

            return payload;
        });

        post(store.url(), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setAbierto(false);
                setAdjuntos([]);
                reset();
            },
        });
    }

    return (
        <Dialog open={abierto} onOpenChange={setAbierto}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="size-4" />
                    <span className="hidden sm:inline">Crear Ticket</span>
                    <span className="sm:hidden">Crear</span>
                </Button>
            </DialogTrigger>

            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Nuevo Ticket</DialogTitle>
                    <DialogDescription>
                        {esSolicitante
                            ? 'Describe tu problema y adjunta evidencia si es necesario.'
                            : 'Completa los campos para crear un nuevo ticket de soporte.'}
                    </DialogDescription>
                </DialogHeader>

                {!esSolicitante && !catalogos ? (
                    <div className="space-y-4">
                        <Skeleton className="h-9 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-9 w-full" />
                            <Skeleton className="h-9 w-full" />
                        </div>
                    </div>
                ) : (
                    <form onSubmit={enviarFormulario} className="space-y-4">
                        {/* Solicitante: solo admin, primero para auto-llenar área */}
                        {esAdmin && catalogos && catalogos.usuarios.length > 0 && (
                            <div className="grid gap-2">
                                <Label>Solicitante</Label>
                                <Select
                                    value={data.solicitante_id}
                                    onValueChange={(v) => {
                                        const usuario =
                                            catalogos.usuarios.find(
                                                (u) => String(u.id) === v,
                                            );
                                        setData((prev) => ({
                                            ...prev,
                                            solicitante_id: v,
                                            ...(usuario?.area_id
                                                ? {
                                                      area_id: String(
                                                          usuario.area_id,
                                                      ),
                                                  }
                                                : {}),
                                        }));
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar usuario..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {catalogos.usuarios.map(
                                            (usuario) => (
                                                <SelectItem
                                                    key={usuario.id}
                                                    value={String(usuario.id)}
                                                >
                                                    {usuario.name} ({usuario.email})
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.solicitante_id} />
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="titulo">Titulo</Label>
                            <Input
                                id="titulo"
                                value={data.titulo}
                                onChange={(e) =>
                                    setData('titulo', e.target.value)
                                }
                                placeholder="Describe brevemente el problema"
                                required
                                maxLength={255}
                            />
                            <InputError message={errors.titulo} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="descripcion">Descripcion</Label>
                            <Textarea
                                id="descripcion"
                                value={data.descripcion}
                                onChange={(e) =>
                                    setData('descripcion', e.target.value)
                                }
                                placeholder="Explica el problema en detalle..."
                                rows={4}
                                required
                            />
                            <InputError message={errors.descripcion} />
                        </div>

                        {/* Campos avanzados: solo para Admin y Auxiliar */}
                        {!esSolicitante && catalogos && (
                            <>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label>Area</Label>
                                        {catalogos.areas.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">
                                                No hay areas.
                                            </p>
                                        ) : (
                                            <Select
                                                value={data.area_id}
                                                onValueChange={(v) =>
                                                    setData('area_id', v)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {catalogos.areas.map(
                                                        (area) => (
                                                            <SelectItem
                                                                key={area.id}
                                                                value={String(area.id)}
                                                            >
                                                                {area.nombre}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        )}
                                        <InputError message={errors.area_id} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>
                                            Categoria{' '}
                                            <span className="text-muted-foreground font-normal">
                                                (opcional)
                                            </span>
                                        </Label>
                                        {catalogos.categorias.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">
                                                No hay categorias.
                                            </p>
                                        ) : (
                                            <Select
                                                value={data.categoria_id}
                                                onValueChange={(v) =>
                                                    setData('categoria_id', v)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categoriasPadre.map(
                                                        (padre) => {
                                                            const hijas =
                                                                categoriasHijas.filter(
                                                                    (h) =>
                                                                        h.padre_id ===
                                                                        padre.id,
                                                                );
                                                            return hijas.length >
                                                                0 ? (
                                                                <SelectGroup
                                                                    key={padre.id}
                                                                >
                                                                    <SelectLabel>
                                                                        {padre.nombre}
                                                                    </SelectLabel>
                                                                    {hijas.map(
                                                                        (hija) => (
                                                                            <SelectItem
                                                                                key={hija.id}
                                                                                value={String(hija.id)}
                                                                            >
                                                                                {hija.nombre}
                                                                            </SelectItem>
                                                                        ),
                                                                    )}
                                                                </SelectGroup>
                                                            ) : (
                                                                <SelectItem
                                                                    key={padre.id}
                                                                    value={String(padre.id)}
                                                                >
                                                                    {padre.nombre}
                                                                </SelectItem>
                                                            );
                                                        },
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        )}
                                        <InputError
                                            message={errors.categoria_id}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>
                                        Prioridad{' '}
                                        <span className="text-muted-foreground font-normal">
                                            (opcional)
                                        </span>
                                    </Label>
                                    {catalogos.prioridades.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            No hay prioridades.
                                        </p>
                                    ) : (
                                        <Select
                                            value={data.prioridad_id}
                                            onValueChange={(v) =>
                                                setData('prioridad_id', v)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {catalogos.prioridades.map(
                                                    (prioridad) => (
                                                        <SelectItem
                                                            key={prioridad.id}
                                                            value={String(prioridad.id)}
                                                        >
                                                            <span className="flex items-center gap-2">
                                                                <span
                                                                    className="inline-block size-2 rounded-full"
                                                                    style={{
                                                                        backgroundColor:
                                                                            prioridad.color,
                                                                    }}
                                                                />
                                                                {prioridad.nombre}
                                                                <span className="text-muted-foreground">
                                                                    ({prioridad.horas_resolucion}h)
                                                                </span>
                                                            </span>
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    <InputError
                                        message={errors.prioridad_id}
                                    />
                                </div>
                            </>
                        )}

                        {/* Zona de adjuntos: disponible para todos */}
                        <div className="grid gap-2">
                            <Label>
                                Evidencia{' '}
                                <span className="text-muted-foreground">
                                    (opcional)
                                </span>
                            </Label>
                            <ZonaAdjuntos
                                archivos={adjuntos}
                                onChange={setAdjuntos}
                                progreso={progress?.percentage}
                            />
                            <InputError
                                message={
                                    (errors as Record<string, string>)['adjuntos'] ||
                                    (errors as Record<string, string>)['adjuntos.0']
                                }
                            />
                        </div>

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setAbierto(false)}
                                disabled={processing}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Creando...' : 'Crear Ticket'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
