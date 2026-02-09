import { router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { store } from '@/actions/App/Http/Controllers/Admin/UbicacionController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CatalogosDashboard } from '@/types';

type Props = {
    departamentos: CatalogosDashboard['departamentos'];
    onCreado: () => void;
};

export default function ModalCrearUbicacionRapida({ departamentos, onCreado }: Props) {
    const [abierto, setAbierto] = useState(false);
    const [procesando, setProcesando] = useState(false);
    const [errores, setErrores] = useState<Record<string, string>>({});

    function enviar(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const datos = Object.fromEntries(new FormData(e.currentTarget));
        setProcesando(true);
        setErrores({});

        router.post(store.url(), datos, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setAbierto(false);
                onCreado();
            },
            onError: (errs) => setErrores(errs),
            onFinish: () => setProcesando(false),
        });
    }

    return (
        <Dialog open={abierto} onOpenChange={setAbierto}>
            <DialogTrigger asChild>
                <Button type="button" size="icon" variant="ghost" className="h-6 w-6" title="Crear ubicación">
                    <Plus className="h-3.5 w-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]" onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle>Nueva Ubicación</DialogTitle>
                </DialogHeader>
                <form onSubmit={enviar} className="grid gap-4 py-2">
                    <div className="grid gap-2">
                        <Label htmlFor="ubi-nombre">Nombre *</Label>
                        <Input id="ubi-nombre" name="nombre" required />
                        <InputError message={errores.nombre} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="ubi-edificio">Edificio *</Label>
                            <Input id="ubi-edificio" name="edificio" required />
                            <InputError message={errores.edificio} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="ubi-piso">Piso</Label>
                            <Input id="ubi-piso" name="piso" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="ubi-salon">Salón</Label>
                            <Input id="ubi-salon" name="salon" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Departamento</Label>
                            {departamentos.length > 0 ? (
                                <Select name="departamento_id">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sin departamento" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departamentos.map((depto) => (
                                            <SelectItem key={depto.id} value={String(depto.id)}>
                                                {depto.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <p className="text-muted-foreground text-sm">Sin departamentos</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setAbierto(false)}>Cancelar</Button>
                        <Button type="submit" disabled={procesando}>
                            {procesando ? 'Creando...' : 'Crear'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
