import { Paperclip, X } from 'lucide-react';
import { useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';

type Props = {
    archivos: File[];
    onChange: (archivos: File[]) => void;
    maximo?: number;
    progreso?: number | null;
};

const TIPOS_PERMITIDOS = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'video/mp4',
    'video/quicktime',
];

const TAMANO_MAXIMO = 10 * 1024 * 1024; // 10 MB

function formatearTamano(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ZonaAdjuntos({
    archivos,
    onChange,
    maximo = 5,
    progreso,
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);

    const agregarArchivos = useCallback(
        (nuevos: FileList | null) => {
            if (!nuevos) return;
            const validos = Array.from(nuevos).filter((archivo) => {
                if (!TIPOS_PERMITIDOS.includes(archivo.type)) return false;
                if (archivo.size > TAMANO_MAXIMO) return false;
                return true;
            });
            const combinados = [...archivos, ...validos].slice(0, maximo);
            onChange(combinados);
        },
        [archivos, onChange, maximo],
    );

    function eliminar(indice: number) {
        onChange(archivos.filter((_, i) => i !== indice));
    }

    function manejarDrop(e: React.DragEvent) {
        e.preventDefault();
        agregarArchivos(e.dataTransfer.files);
    }

    return (
        <div className="space-y-2">
            <div
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 transition-colors hover:border-muted-foreground/50"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={manejarDrop}
            >
                <Paperclip className="mb-2 size-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                    Arrastra archivos aquí o{' '}
                    <span className="font-medium text-foreground">
                        haz clic para seleccionar
                    </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Imágenes, documentos o videos (máx. 10 MB c/u, hasta{' '}
                    {maximo} archivos)
                </p>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.mp4,.mov"
                    onChange={(e) => {
                        agregarArchivos(e.target.files);
                        e.target.value = '';
                    }}
                />
            </div>

            {archivos.length > 0 && (
                <ul className="space-y-1">
                    {archivos.map((archivo, i) => (
                        <li
                            key={`${archivo.name}-${i}`}
                            className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2 text-sm"
                        >
                            <div className="flex items-center gap-2 truncate">
                                <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                                <span className="truncate">{archivo.name}</span>
                                <span className="shrink-0 text-xs text-muted-foreground">
                                    ({formatearTamano(archivo.size)})
                                </span>
                            </div>
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 shrink-0"
                                onClick={() => eliminar(i)}
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </li>
                    ))}
                </ul>
            )}

            {progreso != null && progreso > 0 && (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${progreso}%` }}
                    />
                </div>
            )}
        </div>
    );
}
