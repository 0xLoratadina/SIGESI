import { router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { store } from '@/actions/App/Http/Controllers/Admin/CategoriaController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { CatalogosDashboard } from '@/types';

type Props = {
    categoriasPadre: CatalogosDashboard['categorias'];
    onCreado: () => void;
};

export default function ModalCrearCategoriaRapida({ categoriasPadre, onCreado }: Props) {
    const [abierto, setAbierto] = useState(false);
    const [procesando, setProcesando] = useState(false);
    const [errores, setErrores] = useState<Record<string, string>>({});

    const padres = categoriasPadre.filter((c) => !c.padre_id);

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
                <Button type="button" size="icon" variant="ghost" className="h-6 w-6" title="Crear categoría">
                    <Plus className="h-3.5 w-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]" onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle>Nueva Categoría</DialogTitle>
                </DialogHeader>
                <form onSubmit={enviar} className="grid gap-4 py-2">
                    <div className="grid gap-2">
                        <Label htmlFor="cat-nombre">Nombre *</Label>
                        <Input id="cat-nombre" name="nombre" required />
                        <InputError message={errores.nombre} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="cat-descripcion">Descripción</Label>
                        <Textarea id="cat-descripcion" name="descripcion" rows={2} placeholder="Descripción de la categoría..." />
                    </div>
                    {padres.length > 0 && (
                        <div className="grid gap-2">
                            <Label>Categoría padre</Label>
                            <Select name="padre_id">
                                <SelectTrigger>
                                    <SelectValue placeholder="Ninguna (raíz)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {padres.map((p) => (
                                        <SelectItem key={p.id} value={p.id.toString()}>
                                            {p.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
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
