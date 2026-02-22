import { router, useForm, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { store } from '@/actions/App/Http/Controllers/TicketController';
import InputError from '@/components/input-error';
import ModalCrearAreaRapida from '@/components/modal-crear-area-rapida';
import ModalCrearCategoriaRapida from '@/components/modal-crear-categoria-rapida';
import ModalCrearPrioridadRapida from '@/components/modal-crear-prioridad-rapida';
import ModalCrearUbicacionRapida from '@/components/modal-crear-ubicacion-rapida';
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

    const { data, setData, processing, errors, reset, progress } = useForm({
        titulo: '',
        descripcion: '',
        area_id: '',
        categoria_id: '',
        prioridad_id: '',
        canal: 'Web',
        ubicacion_id: '',
        solicitante_id: '',
        adjuntos: [] as File[],
    });

    const categoriasPadre =
        catalogos?.categorias.filter((c) => !c.padre_id) ?? [];
    const categoriasHijas =
        catalogos?.categorias.filter((c) => c.padre_id) ?? [];

    function recargarCatalogos() {
        router.reload({ only: ['catalogos'] });
    }

    function enviarFormulario(e: FormEvent) {
        e.preventDefault();
        const formData = new FormData();
        formData.append('titulo', data.titulo);
        formData.append('descripcion', data.descripcion);

        if (!esSolicitante) {
            if (data.area_id) formData.append('area_id', data.area_id);
            if (data.categoria_id)
                formData.append('categoria_id', data.categoria_id);
            if (data.prioridad_id)
                formData.append('prioridad_id', data.prioridad_id);
            if (data.canal) formData.append('canal', data.canal);
            if (data.ubicacion_id)
                formData.append('ubicacion_id', data.ubicacion_id);
        }

        if (esAdmin && data.solicitante_id) {
            formData.append('solicitante_id', data.solicitante_id);
        }

        adjuntos.forEach((archivo, i) => {
            formData.append(`adjuntos[${i}]`, archivo);
        });

        router.post(store.url(), formData, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setAbierto(false);
                setAdjuntos([]);
                reset();
            },
            onError: () => {
                // errors are automatically handled by Inertia
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
                                        <div className="flex items-center justify-between">
                                            <Label>Area</Label>
                                            {esAdmin && (
                                                <ModalCrearAreaRapida
                                                    onCreado={recargarCatalogos}
                                                />
                                            )}
                                        </div>
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
                                                                value={String(
                                                                    area.id,
                                                                )}
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
                                        <div className="flex items-center justify-between">
                                            <Label>Categoria</Label>
                                            {esAdmin && (
                                                <ModalCrearCategoriaRapida
                                                    categoriasPadre={
                                                        catalogos.categorias
                                                    }
                                                    onCreado={recargarCatalogos}
                                                />
                                            )}
                                        </div>
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
                                                                    key={
                                                                        padre.id
                                                                    }
                                                                >
                                                                    <SelectLabel>
                                                                        {
                                                                            padre.nombre
                                                                        }
                                                                    </SelectLabel>
                                                                    {hijas.map(
                                                                        (
                                                                            hija,
                                                                        ) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    hija.id
                                                                                }
                                                                                value={String(
                                                                                    hija.id,
                                                                                )}
                                                                            >
                                                                                {
                                                                                    hija.nombre
                                                                                }
                                                                            </SelectItem>
                                                                        ),
                                                                    )}
                                                                </SelectGroup>
                                                            ) : (
                                                                <SelectItem
                                                                    key={
                                                                        padre.id
                                                                    }
                                                                    value={String(
                                                                        padre.id,
                                                                    )}
                                                                >
                                                                    {
                                                                        padre.nombre
                                                                    }
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

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Prioridad</Label>
                                            {esAdmin && (
                                                <ModalCrearPrioridadRapida
                                                    onCreado={recargarCatalogos}
                                                />
                                            )}
                                        </div>
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
                                                                key={
                                                                    prioridad.id
                                                                }
                                                                value={String(
                                                                    prioridad.id,
                                                                )}
                                                            >
                                                                <span className="flex items-center gap-2">
                                                                    <span
                                                                        className="inline-block size-2 rounded-full"
                                                                        style={{
                                                                            backgroundColor:
                                                                                prioridad.color,
                                                                        }}
                                                                    />
                                                                    {
                                                                        prioridad.nombre
                                                                    }
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

                                    <div className="grid gap-2">
                                        <Label>Canal</Label>
                                        <Select
                                            value={data.canal}
                                            onValueChange={(v) =>
                                                setData('canal', v)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {catalogos.canales.map(
                                                    (canal) => (
                                                        <SelectItem
                                                            key={canal}
                                                            value={canal}
                                                        >
                                                            {canal}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.canal} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label>
                                            Ubicacion{' '}
                                            <span className="text-muted-foreground">
                                                (opcional)
                                            </span>
                                        </Label>
                                        {esAdmin && (
                                            <ModalCrearUbicacionRapida
                                                areas={catalogos.areas}
                                                onCreado={recargarCatalogos}
                                            />
                                        )}
                                    </div>
                                    {catalogos.ubicaciones.length > 0 && (
                                        <Select
                                            value={data.ubicacion_id}
                                            onValueChange={(v) =>
                                                setData('ubicacion_id', v)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sin ubicacion" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {catalogos.ubicaciones.map(
                                                    (ubicacion) => (
                                                        <SelectItem
                                                            key={ubicacion.id}
                                                            value={String(
                                                                ubicacion.id,
                                                            )}
                                                        >
                                                            {ubicacion.nombre}
                                                            {ubicacion.edificio &&
                                                                ` - ${ubicacion.edificio}`}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    <InputError message={errors.ubicacion_id} />
                                </div>

                                {esAdmin && catalogos.usuarios.length > 0 && (
                                    <div className="grid gap-2">
                                        <Label>Solicitante</Label>
                                        <Select
                                            value={data.solicitante_id}
                                            onValueChange={(v) =>
                                                setData('solicitante_id', v)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar usuario..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {catalogos.usuarios.map(
                                                    (usuario) => (
                                                        <SelectItem
                                                            key={usuario.id}
                                                            value={String(
                                                                usuario.id,
                                                            )}
                                                        >
                                                            {usuario.name} (
                                                            {usuario.email})
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={errors.solicitante_id}
                                        />
                                    </div>
                                )}
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
                                    errors['adjuntos'] || errors['adjuntos.0']
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
