import { router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { store } from '@/actions/App/Http/Controllers/Admin/PrioridadController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
    onCreado: () => void;
};

export default function ModalCrearPrioridadRapida({ onCreado }: Props) {
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
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    title="Crear prioridad"
                >
                    <Plus className="h-3.5 w-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent
                className="sm:max-w-[400px]"
                onClick={(e) => e.stopPropagation()}
            >
                <DialogHeader>
                    <DialogTitle>Nueva Prioridad</DialogTitle>
                </DialogHeader>
                <form onSubmit={enviar} className="grid gap-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="pri-nombre">Nombre *</Label>
                            <Input id="pri-nombre" name="nombre" required />
                            <InputError message={errores.nombre} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="pri-color">Color *</Label>
                            <Input
                                id="pri-color"
                                name="color"
                                type="color"
                                defaultValue="#3B82F6"
                                className="h-9 cursor-pointer"
                                required
                            />
                            <InputError message={errores.color} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="pri-nivel">Nivel *</Label>
                            <Input
                                id="pri-nivel"
                                name="nivel"
                                type="number"
                                min={1}
                                required
                            />
                            <InputError message={errores.nivel} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="pri-resp">Hrs. Resp. *</Label>
                            <Input
                                id="pri-resp"
                                name="horas_respuesta"
                                type="number"
                                min={1}
                                required
                            />
                            <InputError message={errores.horas_respuesta} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="pri-res">Hrs. Res. *</Label>
                            <Input
                                id="pri-res"
                                name="horas_resolucion"
                                type="number"
                                min={1}
                                required
                            />
                            <InputError message={errores.horas_resolucion} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setAbierto(false)}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={procesando}>
                            {procesando ? 'Creando...' : 'Crear'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
