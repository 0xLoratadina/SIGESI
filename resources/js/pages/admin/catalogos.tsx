import { Head } from '@inertiajs/react';
import { Building2, FolderTree, Gauge, MapPin } from 'lucide-react';
import { useState } from 'react';
import SeccionCategorias from '@/components/admin/seccion-categorias';
import SeccionDepartamentos from '@/components/admin/seccion-departamentos';
import SeccionPrioridades from '@/components/admin/seccion-prioridades';
import SeccionUbicaciones from '@/components/admin/seccion-ubicaciones';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { catalogos } from '@/routes/admin';
import type { BreadcrumbItem, CategoriaConPadre, Departamento, Prioridad, UbicacionConDepto } from '@/types';

type Seccion = 'departamentos' | 'categorias' | 'prioridades' | 'ubicaciones';

type Props = {
    departamentos: Departamento[];
    categorias: CategoriaConPadre[];
    prioridades: Prioridad[];
    ubicaciones: UbicacionConDepto[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Catálogos', href: catalogos().url },
];

const secciones: { clave: Seccion; titulo: string; icono: typeof Building2 }[] = [
    { clave: 'departamentos', titulo: 'Departamentos', icono: Building2 },
    { clave: 'categorias', titulo: 'Categorías', icono: FolderTree },
    { clave: 'prioridades', titulo: 'Prioridades', icono: Gauge },
    { clave: 'ubicaciones', titulo: 'Ubicaciones', icono: MapPin },
];

export default function Catalogos({ departamentos, categorias, prioridades, ubicaciones }: Props) {
    const [activa, setActiva] = useState<Seccion>('departamentos');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Catálogos" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap gap-2">
                    {secciones.map((s) => (
                        <Button
                            key={s.clave}
                            variant={activa === s.clave ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setActiva(s.clave)}
                        >
                            <s.icono className="mr-1 h-4 w-4" />
                            {s.titulo}
                        </Button>
                    ))}
                </div>

                <Card className="flex-1">
                    <CardHeader>
                        <CardTitle>
                            {secciones.find((s) => s.clave === activa)?.titulo}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {activa === 'departamentos' && <SeccionDepartamentos departamentos={departamentos} />}
                        {activa === 'categorias' && <SeccionCategorias categorias={categorias} />}
                        {activa === 'prioridades' && <SeccionPrioridades prioridades={prioridades} />}
                        {activa === 'ubicaciones' && <SeccionUbicaciones ubicaciones={ubicaciones} departamentos={departamentos} />}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
