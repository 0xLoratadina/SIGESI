import { Head } from '@inertiajs/react';
import { Building2, ExternalLink, Plus, Search, UserCog } from 'lucide-react';
import { useRef, useState } from 'react';
import SeccionAreas, {
    type SeccionAreasRef,
} from '@/components/admin/seccion-areas';
import SeccionAuxiliares from '@/components/admin/seccion-auxiliares';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { catalogos, usuarios } from '@/routes/admin';
import type { BreadcrumbItem, Area } from '@/types';
import type { AuxiliarAdmin } from '@/types/models';

type Seccion = 'areas' | 'auxiliares';

type Props = {
    areas: Area[];
    auxiliares: AuxiliarAdmin[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Configuracion', href: catalogos().url },
];

const secciones: { clave: Seccion; titulo: string; icono: typeof Building2 }[] =
    [
        { clave: 'areas', titulo: 'Areas', icono: Building2 },
        { clave: 'auxiliares', titulo: 'Auxiliares', icono: UserCog },
    ];

export default function Catalogos({ areas, auxiliares }: Props) {
    const [activa, setActiva] = useState<Seccion>('areas');
    const [busqueda, setBusqueda] = useState('');
    const areasRef = useRef<SeccionAreasRef>(null);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configuracion" />

            <div className="flex min-w-0 flex-col gap-4 p-4 md:min-h-0 md:flex-1">
                <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                        {secciones.map((s) => (
                            <Button
                                key={s.clave}
                                variant={
                                    activa === s.clave ? 'default' : 'outline'
                                }
                                size="sm"
                                onClick={() => {
                                    setActiva(s.clave);
                                    setBusqueda('');
                                }}
                            >
                                <s.icono className="mr-1 h-4 w-4" />
                                {s.titulo}
                            </Button>
                        ))}
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar por nombre..."
                            className="pl-9"
                        />
                    </div>
                </div>

                <Card className="flex min-w-0 flex-col overflow-hidden md:min-h-0 md:flex-1">
                    <CardHeader className="flex shrink-0 flex-row items-center justify-between">
                        <CardTitle>
                            {secciones.find((s) => s.clave === activa)?.titulo}
                        </CardTitle>
                        {activa === 'areas' && (
                            <Button
                                size="sm"
                                onClick={() =>
                                    areasRef.current?.abrirFormulario()
                                }
                            >
                                <Plus className="mr-1 h-4 w-4" /> Agregar
                            </Button>
                        )}
                        {activa === 'auxiliares' && (
                            <Button size="sm" variant="outline" asChild>
                                <a href={usuarios().url + '?rol=Auxiliar'}>
                                    <ExternalLink className="mr-1 h-4 w-4" />{' '}
                                    Agregar desde Usuarios
                                </a>
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="flex flex-col md:min-h-0 md:flex-1">
                        {activa === 'areas' && (
                            <SeccionAreas
                                ref={areasRef}
                                areas={areas}
                                busqueda={busqueda}
                            />
                        )}
                        {activa === 'auxiliares' && (
                            <SeccionAuxiliares
                                auxiliares={auxiliares}
                                busqueda={busqueda}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
