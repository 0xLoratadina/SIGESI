import { router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { store } from '@/actions/App/Http/Controllers/Admin/DepartamentoController';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';

type Props = {
    onCreado: () => void;
};

export default function ModalCrearDepartamentoRapido({ onCreado }: Props) {
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
                <Button type="button" size="icon" variant="ghost" className="h-6 w-6" title="Crear departamento">
                    <Plus className="h-3.5 w-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]" onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle>Nuevo Departamento</DialogTitle>
                </DialogHeader>
                <form onSubmit={enviar} className="grid gap-4 py-2">
                    <div className="grid gap-2">
                        <Label htmlFor="depto-nombre">Nombre *</Label>
                        <Input id="depto-nombre" name="nombre" required />
                        <InputError message={errores.nombre} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="depto-codigo">Código *</Label>
                        <Input id="depto-codigo" name="codigo" maxLength={10} required />
                        <InputError message={errores.codigo} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="depto-edificio">Edificio</Label>
                            <Input id="depto-edificio" name="edificio" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="depto-telefono">Teléfono</Label>
                            <Input id="depto-telefono" name="telefono" />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="depto-jefe">Jefe / Responsable</Label>
                        <Input id="depto-jefe" name="jefe" />
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
