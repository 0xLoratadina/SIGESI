import { Head } from '@inertiajs/react';
import { Building2, UserCog } from 'lucide-react';
import { useState } from 'react';
import SeccionAreas from '@/components/admin/seccion-areas';
import SeccionAuxiliares from '@/components/admin/seccion-auxiliares';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { catalogos } from '@/routes/admin';
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

const secciones: { clave: Seccion; titulo: string; icono: typeof Building2 }[] = [
    { clave: 'areas', titulo: 'Areas', icono: Building2 },
    { clave: 'auxiliares', titulo: 'Auxiliares', icono: UserCog },
];

export default function Catalogos({ areas, auxiliares }: Props) {
    const [activa, setActiva] = useState<Seccion>('areas');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configuracion" />

            <div className="flex min-w-0 flex-col gap-4 p-4 md:min-h-0 md:flex-1">
                <div className="shrink-0 flex flex-wrap gap-2">
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

                <Card className="flex min-w-0 flex-col overflow-hidden md:min-h-0 md:flex-1">
                    <CardHeader className="shrink-0">
                        <CardTitle>
                            {secciones.find((s) => s.clave === activa)?.titulo}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col md:min-h-0 md:flex-1">
                        {activa === 'areas' && <SeccionAreas areas={areas} />}
                        {activa === 'auxiliares' && <SeccionAuxiliares auxiliares={auxiliares} />}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
