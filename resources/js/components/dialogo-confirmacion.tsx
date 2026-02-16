import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type Props = {
    abierto: boolean;
    onCerrar: () => void;
    onConfirmar: () => void;
    titulo: string;
    descripcion: string;
    textoConfirmar?: string;
    textoCancelar?: string;
    variante?: 'destructiva' | 'normal';
};

export default function DialogoConfirmacion({
    abierto,
    onCerrar,
    onConfirmar,
    titulo,
    descripcion,
    textoConfirmar = 'Confirmar',
    textoCancelar = 'Cancelar',
    variante = 'normal',
}: Props) {
    return (
        <Dialog open={abierto} onOpenChange={(v) => { if (!v) onCerrar(); }}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{titulo}</DialogTitle>
                    <DialogDescription>{descripcion}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onCerrar}>
                        {textoCancelar}
                    </Button>
                    <Button
                        variant={variante === 'destructiva' ? 'destructive' : 'default'}
                        onClick={onConfirmar}
                    >
                        {textoConfirmar}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
