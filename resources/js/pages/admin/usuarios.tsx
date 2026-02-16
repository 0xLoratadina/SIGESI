import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Check, Copy, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { store, update, destroy } from '@/actions/App/Http/Controllers/Admin/UsuarioController';
import DialogoConfirmacion from '@/components/dialogo-confirmacion';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { usuarios } from '@/routes/admin';
import type { BreadcrumbItem, Credenciales, DatosPaginados, SharedData } from '@/types';
import type { Rol, User } from '@/types/auth';

type UsuarioAdmin = User & {
    departamento?: { id: number; nombre: string } | null;
};

type Props = {
    usuarios: DatosPaginados<UsuarioAdmin>;
    departamentos: { id: number; nombre: string }[];
    filtroRol: string;
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Usuarios', href: usuarios().url }];

const roles: Rol[] = ['Administrador', 'Tecnico', 'Solicitante'];

const colorRol: Record<Rol, 'default' | 'secondary' | 'outline'> = {
    Administrador: 'default',
    Tecnico: 'secondary',
    Solicitante: 'outline',
};

export default function UsuariosAdmin({ usuarios: paginado, departamentos, filtroRol }: Props) {
    const { flash } = usePage<SharedData>().props;
    const [abierto, setAbierto] = useState(false);
    const [editando, setEditando] = useState<UsuarioAdmin | null>(null);
    const [eliminando, setEliminando] = useState<UsuarioAdmin | null>(null);
    const [credenciales, setCredenciales] = useState<Credenciales | null>(null);
    const [copiado, setCopiado] = useState(false);

    const formCrear = useForm({
        name: '',
        email: '',
        rol: 'Solicitante' as Rol,
    });

    const formEditar = useForm({
        name: '',
        email: '',
        rol: 'Solicitante' as Rol,
        password_temporal: '',
    });

    useEffect(() => {
        if (flash.credenciales) {
            setCredenciales(flash.credenciales);
        }
    }, [flash.credenciales]);

    function abrirCrear() {
        setEditando(null);
        formCrear.reset();
        formCrear.clearErrors();
        setAbierto(true);
    }

    function abrirEdicion(usuario: UsuarioAdmin) {
        setEditando(usuario);
        formEditar.setData({
            name: usuario.name,
            email: usuario.email,
            rol: usuario.rol,
            password_temporal: '',
        });
        formEditar.clearErrors();
        setAbierto(true);
    }

    function cerrar() {
        setAbierto(false);
        setEditando(null);
    }

    function enviarCrear(e: FormEvent) {
        e.preventDefault();
        formCrear.post(store.url(), { preserveScroll: true, onSuccess: cerrar });
    }

    function enviarEditar(e: FormEvent) {
        e.preventDefault();
        if (!editando) return;
        formEditar.put(update.url(editando.id), { preserveScroll: true, onSuccess: cerrar });
    }

    function confirmarEliminar() {
        if (!eliminando) return;
        router.delete(destroy.url(eliminando.id), {
            preserveScroll: true,
            onSuccess: () => setEliminando(null),
        });
    }

    function filtrarRol(rol: string) {
        router.get(usuarios().url, rol ? { rol } : {}, { preserveState: true, preserveScroll: true });
    }

    function copiarCredenciales() {
        if (!credenciales) return;
        const texto = `Credenciales SIGESI\nNombre: ${credenciales.nombre}\nEmail: ${credenciales.email}\nContraseña temporal: ${credenciales.password}\nRol: ${credenciales.rol}`;
        navigator.clipboard.writeText(texto);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Usuarios" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap gap-2">
                    <Button variant={!filtroRol ? 'default' : 'outline'} size="sm" onClick={() => filtrarRol('')}>
                        <Users className="mr-1 h-4 w-4" />
                        Todos
                    </Button>
                    {roles.map((rol) => (
                        <Button key={rol} variant={filtroRol === rol ? 'default' : 'outline'} size="sm" onClick={() => filtrarRol(rol)}>
                            {rol}
                        </Button>
                    ))}
                </div>

                <Card className="flex-1">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Usuarios</CardTitle>
                        <Button size="sm" onClick={abrirCrear}>
                            <Plus className="mr-1 h-4 w-4" /> Agregar
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {paginado.data.length === 0 ? (
                            <div className="text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                                <p>No hay usuarios registrados.</p>
                            </div>
                        ) : (
                            <>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nombre</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Rol</TableHead>
                                                <TableHead className="hidden md:table-cell">Departamento</TableHead>
                                                <TableHead>Estado</TableHead>
                                                <TableHead className="hidden sm:table-cell">Onboarding</TableHead>
                                                <TableHead className="w-[100px]">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginado.data.map((usuario) => (
                                                <TableRow key={usuario.id}>
                                                    <TableCell className="font-medium">{usuario.name}</TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">{usuario.email}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={colorRol[usuario.rol]}>{usuario.rol}</Badge>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                        {usuario.departamento?.nombre ?? '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={usuario.activo ? 'default' : 'secondary'}>
                                                            {usuario.activo ? 'Activo' : 'Inactivo'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="hidden sm:table-cell">
                                                        <Badge variant={usuario.onboarding_completado ? 'default' : 'outline'}>
                                                            {usuario.onboarding_completado ? 'Completado' : 'Pendiente'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-1">
                                                            <Button size="icon" variant="ghost" onClick={() => abrirEdicion(usuario)} title="Editar">
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            {usuario.rol !== 'Administrador' && (
                                                                <Button size="icon" variant="ghost" onClick={() => setEliminando(usuario)} title="Eliminar">
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Paginacion */}
                                {paginado.last_page > 1 && (
                                    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                                        <span>
                                            Mostrando {paginado.from}–{paginado.to} de {paginado.total}
                                        </span>
                                        <div className="flex gap-1">
                                            {paginado.links.map((enlace, i) => (
                                                <Button
                                                    key={i}
                                                    size="sm"
                                                    variant={enlace.active ? 'default' : 'outline'}
                                                    disabled={!enlace.url}
                                                    onClick={() => enlace.url && router.get(enlace.url, {}, { preserveState: true })}
                                                    dangerouslySetInnerHTML={{ __html: enlace.label }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Dialog crear */}
                <Dialog open={abierto && !editando} onOpenChange={(v) => { if (!v) cerrar(); }}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Nuevo Usuario</DialogTitle>
                            <DialogDescription>
                                El sistema generará una contraseña temporal automáticamente.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={enviarCrear} className="grid gap-4 py-2">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre *</Label>
                                <Input
                                    id="name"
                                    value={formCrear.data.name}
                                    onChange={(e) => formCrear.setData('name', e.target.value)}
                                    required
                                />
                                <InputError message={formCrear.errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formCrear.data.email}
                                    onChange={(e) => formCrear.setData('email', e.target.value)}
                                    required
                                />
                                <InputError message={formCrear.errors.email} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Rol *</Label>
                                <Select value={formCrear.data.rol} onValueChange={(v) => formCrear.setData('rol', v as Rol)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((rol) => (
                                            <SelectItem key={rol} value={rol}>
                                                {rol}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={formCrear.errors.rol} />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={cerrar}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={formCrear.processing}>
                                    {formCrear.processing ? 'Creando...' : 'Crear usuario'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Dialog editar */}
                <Dialog open={abierto && !!editando} onOpenChange={(v) => { if (!v) cerrar(); }}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Editar Usuario</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={enviarEditar} className="grid gap-4 py-2">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Nombre *</Label>
                                <Input
                                    id="edit-name"
                                    value={formEditar.data.name}
                                    onChange={(e) => formEditar.setData('name', e.target.value)}
                                    required
                                />
                                <InputError message={formEditar.errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-email">Email *</Label>
                                <Input
                                    id="edit-email"
                                    type="email"
                                    value={formEditar.data.email}
                                    onChange={(e) => formEditar.setData('email', e.target.value)}
                                    required
                                />
                                <InputError message={formEditar.errors.email} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Rol *</Label>
                                <Select value={formEditar.data.rol} onValueChange={(v) => formEditar.setData('rol', v as Rol)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((rol) => (
                                            <SelectItem key={rol} value={rol}>
                                                {rol}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={formEditar.errors.rol} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-password">Nueva contraseña</Label>
                                <Input
                                    id="edit-password"
                                    type="password"
                                    value={formEditar.data.password_temporal}
                                    onChange={(e) => formEditar.setData('password_temporal', e.target.value)}
                                    placeholder="Dejar vacío para mantener"
                                    minLength={8}
                                />
                                <InputError message={formEditar.errors.password_temporal} />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={cerrar}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={formEditar.processing}>
                                    {formEditar.processing ? 'Guardando...' : 'Guardar'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Dialog credenciales generadas */}
                <Dialog open={!!credenciales} onOpenChange={(v) => { if (!v) setCredenciales(null); }}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Usuario creado</DialogTitle>
                            <DialogDescription>
                                Envía estas credenciales al usuario para que pueda iniciar sesión.
                            </DialogDescription>
                        </DialogHeader>
                        {credenciales && (
                            <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Nombre</span>
                                    <span className="font-medium">{credenciales.nombre}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Email</span>
                                    <span className="font-medium">{credenciales.email}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Contraseña</span>
                                    <span className="font-mono font-medium">{credenciales.password}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Rol</span>
                                    <span className="font-medium">{credenciales.rol}</span>
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={copiarCredenciales}>
                                {copiado ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
                                {copiado ? 'Copiado' : 'Copiar'}
                            </Button>
                            <Button onClick={() => setCredenciales(null)}>Entendido</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <DialogoConfirmacion
                    abierto={!!eliminando}
                    onCerrar={() => setEliminando(null)}
                    onConfirmar={confirmarEliminar}
                    titulo="Eliminar usuario"
                    descripcion={`¿Estás seguro de que deseas eliminar o desactivar al usuario "${eliminando?.name}"? Si el usuario tiene tickets asociados, será desactivado en lugar de eliminado.`}
                    textoConfirmar="Eliminar"
                    variante="destructiva"
                />
            </div>
        </AppLayout>
    );
}
