import { Head, useForm, usePage } from '@inertiajs/react';
import { Building2, Check, CircleUser, Lock, MapPin } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { completar, cambiarPassword } from '@/actions/App/Http/Controllers/OnboardingController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import OnboardingLayout from '@/layouts/onboarding-layout';
import type { SharedData } from '@/types';

type Props = {
    areas: { id: number; nombre: string }[];
    ubicaciones: { id: number; nombre: string; area_id: number }[];
    debeCambiarPassword: boolean;
};

type PasoConfig = {
    titulo: string;
    descripcion: string;
    icono: React.ElementType;
};

export default function OnboardingIndex({ areas, ubicaciones, debeCambiarPassword }: Props) {
    const { auth } = usePage<SharedData>().props;
    const pasos = obtenerPasos(debeCambiarPassword);
    const [pasoActual, setPasoActual] = useState(0);

    const formPassword = useForm({
        password: '',
        password_confirmation: '',
    });

    const formPerfil = useForm({
        name: auth.user.name ?? '',
        telefono: auth.user.telefono ?? '',
        cargo: auth.user.cargo ?? '',
        area_id: auth.user.area_id ? String(auth.user.area_id) : '',
        ubicacion_id: auth.user.ubicacion_id ? String(auth.user.ubicacion_id) : '',
    });

    const ubicacionesFiltradas = useMemo(
        () => ubicaciones.filter((u) => String(u.area_id) === formPerfil.data.area_id),
        [ubicaciones, formPerfil.data.area_id],
    );

    const pasoReal = pasos[pasoActual];
    const desplazamiento = debeCambiarPassword ? 0 : -1;
    const esPasoPassword = debeCambiarPassword && pasoActual === 0;
    const esPasoInfo = pasoActual === 1 + desplazamiento;
    const esPasoArea = pasoActual === 2 + desplazamiento;
    const esPasoUbicacion = pasoActual === 3 + desplazamiento;
    const esPasoConfirm = pasoActual === pasos.length - 1;

    function enviarPassword(e: FormEvent) {
        e.preventDefault();
        formPassword.put(cambiarPassword.url(), {
            preserveScroll: true,
        });
    }

    function siguientePaso() {
        setPasoActual((p) => Math.min(p + 1, pasos.length - 1));
    }

    function pasoAnterior() {
        setPasoActual((p) => Math.max(p - 1, 0));
    }

    function seleccionarArea(valor: string) {
        formPerfil.setData((datos) => ({
            ...datos,
            area_id: valor,
            ubicacion_id: '',
        }));
    }

    function enviarPerfil(e: FormEvent) {
        e.preventDefault();
        formPerfil.post(completar.url(), {
            preserveScroll: true,
        });
    }

    const areaSeleccionada = areas.find((a) => String(a.id) === formPerfil.data.area_id);
    const ubicacionSeleccionada = ubicaciones.find((u) => String(u.id) === formPerfil.data.ubicacion_id);

    return (
        <OnboardingLayout>
            <Head title="Onboarding" />

            {/* Barra de progreso */}
            <div className="mb-8">
                <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                        Paso {pasoActual + 1} de {pasos.length}
                    </span>
                    <span>{Math.round(((pasoActual + 1) / pasos.length) * 100)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                        className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${((pasoActual + 1) / pasos.length) * 100}%` }}
                    />
                </div>
                {/* Indicadores de pasos */}
                <div className="mt-4 flex justify-between">
                    {pasos.map((paso, i) => {
                        const Icono = paso.icono;
                        const completado = i < pasoActual;
                        const activo = i === pasoActual;
                        return (
                            <div key={i} className="flex flex-col items-center gap-1">
                                <div
                                    className={`flex size-10 items-center justify-center rounded-full border-2 transition-colors ${
                                        completado
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : activo
                                              ? 'border-primary bg-background text-primary'
                                              : 'border-muted bg-background text-muted-foreground'
                                    }`}
                                >
                                    {completado ? <Check className="size-5" /> : <Icono className="size-5" />}
                                </div>
                                <span className={`text-xs ${activo ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                                    {paso.titulo}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Contenido del paso */}
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-lg">{pasoReal.titulo}</CardTitle>
                    <CardDescription>{pasoReal.descripcion}</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Paso: Cambiar contrasena */}
                    {esPasoPassword && (
                        <form onSubmit={enviarPassword} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="password">Nueva contrasena</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formPassword.data.password}
                                    onChange={(e) => formPassword.setData('password', e.target.value)}
                                    placeholder="Minimo 8 caracteres"
                                    required
                                    autoFocus
                                />
                                <InputError message={formPassword.errors.password} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">Confirmar contrasena</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={formPassword.data.password_confirmation}
                                    onChange={(e) => formPassword.setData('password_confirmation', e.target.value)}
                                    placeholder="Repite la contrasena"
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={formPassword.processing}>
                                {formPassword.processing ? 'Cambiando...' : 'Cambiar contrasena'}
                            </Button>
                        </form>
                    )}

                    {/* Paso: Informacion personal */}
                    {esPasoInfo && (
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre completo</Label>
                                <Input
                                    id="name"
                                    value={formPerfil.data.name}
                                    onChange={(e) => formPerfil.setData('name', e.target.value)}
                                    placeholder="Ej: Juan Perez Lopez"
                                    required
                                    autoFocus
                                />
                                <InputError message={formPerfil.errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="telefono">Telefono</Label>
                                <Input
                                    id="telefono"
                                    value={formPerfil.data.telefono}
                                    onChange={(e) => formPerfil.setData('telefono', e.target.value)}
                                    placeholder="Ej: 5551234567"
                                    required
                                />
                                <InputError message={formPerfil.errors.telefono} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="cargo">Cargo / Puesto</Label>
                                <Input
                                    id="cargo"
                                    value={formPerfil.data.cargo}
                                    onChange={(e) => formPerfil.setData('cargo', e.target.value)}
                                    placeholder="Ej: Coordinador de Sistemas"
                                    required
                                />
                                <InputError message={formPerfil.errors.cargo} />
                            </div>
                            <div className="flex gap-3">
                                {debeCambiarPassword && (
                                    <Button type="button" variant="outline" className="flex-1" onClick={pasoAnterior}>
                                        Atras
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    className="flex-1"
                                    onClick={siguientePaso}
                                    disabled={!formPerfil.data.name || !formPerfil.data.telefono || !formPerfil.data.cargo}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Paso: Area */}
                    {esPasoArea && (
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Area</Label>
                                {areas.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No hay areas disponibles. Contacta al administrador.
                                    </p>
                                ) : (
                                    <Select value={formPerfil.data.area_id} onValueChange={seleccionarArea}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona tu area..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {areas.map((area) => (
                                                <SelectItem key={area.id} value={String(area.id)}>
                                                    {area.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                <InputError message={formPerfil.errors.area_id} />
                            </div>
                            <div className="flex gap-3">
                                <Button type="button" variant="outline" className="flex-1" onClick={pasoAnterior}>
                                    Atras
                                </Button>
                                <Button
                                    type="button"
                                    className="flex-1"
                                    onClick={siguientePaso}
                                    disabled={!formPerfil.data.area_id}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Paso: Ubicacion */}
                    {esPasoUbicacion && !esPasoConfirm && (
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Ubicacion</Label>
                                {ubicacionesFiltradas.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No hay ubicaciones registradas para tu area. Puedes continuar sin seleccionar una.
                                    </p>
                                ) : (
                                    <Select
                                        value={formPerfil.data.ubicacion_id}
                                        onValueChange={(v) => formPerfil.setData('ubicacion_id', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona tu ubicacion..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ubicacionesFiltradas.map((ubi) => (
                                                <SelectItem key={ubi.id} value={String(ubi.id)}>
                                                    {ubi.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                <InputError message={formPerfil.errors.ubicacion_id} />
                            </div>
                            <div className="flex gap-3">
                                <Button type="button" variant="outline" className="flex-1" onClick={pasoAnterior}>
                                    Atras
                                </Button>
                                <Button type="button" className="flex-1" onClick={siguientePaso}>
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Paso: Confirmacion */}
                    {esPasoConfirm && !esPasoUbicacion && (
                        <form onSubmit={enviarPerfil} className="space-y-4">
                            <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Nombre</span>
                                    <span className="font-medium">{formPerfil.data.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Email</span>
                                    <span className="font-medium">{auth.user.email}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Telefono</span>
                                    <span className="font-medium">{formPerfil.data.telefono}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Cargo</span>
                                    <span className="font-medium">{formPerfil.data.cargo}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Area</span>
                                    <span className="font-medium">{areaSeleccionada?.nombre ?? '--'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Ubicacion</span>
                                    <span className="font-medium">{ubicacionSeleccionada?.nombre ?? 'Sin especificar'}</span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button type="button" variant="outline" className="flex-1" onClick={pasoAnterior}>
                                    Atras
                                </Button>
                                <Button type="submit" className="flex-1" disabled={formPerfil.processing}>
                                    {formPerfil.processing ? 'Guardando...' : 'Completar'}
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </OnboardingLayout>
    );
}

function obtenerPasos(debeCambiarPassword: boolean): PasoConfig[] {
    const pasos: PasoConfig[] = [];

    if (debeCambiarPassword) {
        pasos.push({
            titulo: 'Contrasena',
            descripcion: 'Cambia tu contrasena temporal por una segura.',
            icono: Lock,
        });
    }

    pasos.push(
        {
            titulo: 'Informacion',
            descripcion: 'Completa tus datos personales.',
            icono: CircleUser,
        },
        {
            titulo: 'Area',
            descripcion: 'Selecciona el area al que perteneces.',
            icono: Building2,
        },
        {
            titulo: 'Ubicacion',
            descripcion: 'Selecciona tu ubicacion fisica.',
            icono: MapPin,
        },
        {
            titulo: 'Confirmacion',
            descripcion: 'Verifica que tus datos sean correctos.',
            icono: Check,
        },
    );

    return pasos;
}
