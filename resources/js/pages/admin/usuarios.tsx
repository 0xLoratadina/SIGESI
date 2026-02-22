import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Check, ChevronLeft, ChevronRight, Copy, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { store, update, destroy, destroyMultiple } from '@/actions/App/Http/Controllers/Admin/UsuarioController';
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
import type { Area, BreadcrumbItem, Credenciales, SharedData } from '@/types';
import type { Rol, User } from '@/types/auth';

type UsuarioAdmin = User & {
    area?: { id: number; nombre: string } | null;
};

type Props = {
    usuarios: UsuarioAdmin[];
    areas: { id: number; nombre: string }[];
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Usuarios', href: usuarios().url }];

const roles: Rol[] = ['Administrador', 'Auxiliar', 'Solicitante'];

const colorRol: Record<Rol, 'default' | 'secondary' | 'outline'> = {
    Administrador: 'default',
    Auxiliar: 'secondary',
    Solicitante: 'outline',
};

const ALTURA_ENCABEZADO_EST = 41;
const ALTURA_FILA_EST = 49;
const POR_PAGINA_MOVIL = 10;

export default function UsuariosAdmin({ usuarios, areas }: Props) {
    const { flash } = usePage<SharedData>().props;
    const [abierto, setAbierto] = useState(false);
    const [editando, setEditando] = useState<UsuarioAdmin | null>(null);
    const [eliminando, setEliminando] = useState<UsuarioAdmin | null>(null);
    const [credenciales, setCredenciales] = useState<Credenciales | null>(null);
    const [copiado, setCopiado] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [filtroRol, setFiltroRol] = useState('');
    const contenedorRef = useRef<HTMLDivElement>(null);
    const [elementosPorPagina, setElementosPorPagina] = useState(POR_PAGINA_MOVIL);
    const [pagina, setPagina] = useState(1);

    const usuariosFiltrados = useMemo(() => {
        let lista = usuarios;
        if (filtroRol) {
            lista = lista.filter((u) => u.rol === filtroRol);
        }
        if (busqueda.trim()) {
            const termino = busqueda.toLowerCase().trim();
            lista = lista.filter(
                (u) => u.name.toLowerCase().includes(termino) || u.email.toLowerCase().includes(termino),
            );
        }
        return lista;
    }, [usuarios, filtroRol, busqueda]);

    const hayDatos = usuariosFiltrados.length > 0;

    useEffect(() => {
        if (!hayDatos) return;
        const el = contenedorRef.current;
        if (!el) return;
        const mq = window.matchMedia('(min-width: 768px)');

        function calcular() {
            if (!mq.matches) {
                setElementosPorPagina(POR_PAGINA_MOVIL);
                return;
            }
            const thead = el.querySelector('thead');
            const fila = el.querySelector('tbody tr');
            const altEnc = thead?.getBoundingClientRect().height ?? ALTURA_ENCABEZADO_EST;
            const altFila = fila?.getBoundingClientRect().height ?? ALTURA_FILA_EST;
            const filas = Math.max(1, Math.floor((el.clientHeight - altEnc) / altFila));
            setElementosPorPagina(filas);
        }

        const observer = new ResizeObserver(calcular);
        observer.observe(el);
        mq.addEventListener('change', calcular);

        return () => {
            observer.disconnect();
            mq.removeEventListener('change', calcular);
        };
    }, [hayDatos]);

    const totalPaginas = Math.max(1, Math.ceil(usuariosFiltrados.length / elementosPorPagina));

    useEffect(() => {
        if (pagina > totalPaginas) setPagina(totalPaginas);
    }, [totalPaginas, pagina]);

    useEffect(() => {
        setPagina(1);
    }, [busqueda, filtroRol]);

    const usuariosPaginados = useMemo(
        () => usuariosFiltrados.slice((pagina - 1) * elementosPorPagina, pagina * elementosPorPagina),
        [usuariosFiltrados, pagina, elementosPorPagina],
    );

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

    function copiarCredenciales() {
        if (!credenciales) return;
        const texto = `Credenciales SIGESI\nNombre: ${credenciales.nombre}\nEmail: ${credenciales.email}\nContrasena temporal: ${credenciales.password}\nRol: ${credenciales.rol}`;
        navigator.clipboard.writeText(texto);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Usuarios" />

            <div className="flex min-w-0 flex-col gap-4 p-4 md:min-h-0 md:flex-1">
                <div className="shrink-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                        <Button variant={!filtroRol ? 'default' : 'outline'} size="sm" onClick={() => setFiltroRol('')}>
                            <Users className="mr-1 h-4 w-4" />
                            Todos
                        </Button>
                        {roles.map((rol) => (
                            <Button key={rol} variant={filtroRol === rol ? 'default' : 'outline'} size="sm" onClick={() => setFiltroRol(rol)}>
                                {rol}
                            </Button>
                        ))}
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="text-muted-foreground absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
                        <Input
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar por nombre o email..."
                            className="pl-9"
                        />
                    </div>
                </div>

                <Card className="flex min-w-0 flex-col overflow-hidden md:min-h-0 md:flex-1">
                    <CardHeader className="shrink-0 flex flex-row items-center justify-between">
                        <CardTitle>Usuarios</CardTitle>
                        <Button size="sm" onClick={abrirCrear}>
                            <Plus className="mr-1 h-4 w-4" /> Agregar
                        </Button>
                    </CardHeader>
                    <CardContent className="flex flex-col md:min-h-0 md:flex-1">
                        {usuariosFiltrados.length === 0 ? (
                            <div className="text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                                <p>{busqueda.trim() ? 'No se encontraron usuarios que coincidan con la busqueda.' : 'No hay usuarios registrados.'}</p>
                            </div>
                        ) : (
                            <>
                                <div ref={contenedorRef} className="overflow-x-auto rounded-md border md:min-h-0 md:flex-1 md:overflow-hidden">
                                    <Table className="min-w-[700px] table-fixed">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[18%]">Nombre</TableHead>
                                                <TableHead className="w-[22%]">Email</TableHead>
                                                <TableHead className="w-[12%]">Rol</TableHead>
                                                <TableHead className="w-[18%]">Area</TableHead>
                                                <TableHead className="w-[10%]">Estado</TableHead>
                                                <TableHead className="w-[12%]">Onboarding</TableHead>
                                                <TableHead className="w-[8%]">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {usuariosPaginados.map((usuario) => (
                                                <TableRow key={usuario.id}>
                                                    <TableCell className="truncate font-medium">{usuario.name}</TableCell>
                                                    <TableCell className="truncate text-sm text-muted-foreground">{usuario.email}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={colorRol[usuario.rol]}>{usuario.rol}</Badge>
                                                    </TableCell>
                                                    <TableCell className="truncate">
                                                        {usuario.area?.nombre ?? '--'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={usuario.activo ? 'default' : 'secondary'}>
                                                            {usuario.activo ? 'Activo' : 'Inactivo'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
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

                                <div className="shrink-0 flex items-center justify-between pt-2">
                                    <p className="text-muted-foreground text-xs">
                                        Mostrando {(pagina - 1) * elementosPorPagina + 1} a {Math.min(pagina * elementosPorPagina, usuariosFiltrados.length)} de {usuariosFiltrados.length}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <Button size="sm" variant="outline" disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        {Array.from({ length: totalPaginas }, (_, i) => (
                                            <Button key={i + 1} size="sm" variant={pagina === i + 1 ? 'default' : 'outline'} onClick={() => setPagina(i + 1)}>
                                                {i + 1}
                                            </Button>
                                        ))}
                                        <Button size="sm" variant="outline" disabled={pagina === totalPaginas} onClick={() => setPagina(pagina + 1)}>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
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
                                El sistema generara una contrasena temporal automaticamente.
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
                                <Label htmlFor="edit-password">Nueva contrasena</Label>
                                <Input
                                    id="edit-password"
                                    type="password"
                                    value={formEditar.data.password_temporal}
                                    onChange={(e) => formEditar.setData('password_temporal', e.target.value)}
                                    placeholder="Dejar vacio para mantener"
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
                                Envia estas credenciales al usuario para que pueda iniciar sesion.
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
                                    <span className="text-muted-foreground">Contrasena</span>
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
                    descripcion={`¿Estas seguro de que deseas eliminar o desactivar al usuario "${eliminando?.name}"? Si el usuario tiene tickets asociados, sera desactivado en lugar de eliminado.`}
                    textoConfirmar="Eliminar"
                    variante="destructiva"
                />
            </div>
        </AppLayout>
    );
}
