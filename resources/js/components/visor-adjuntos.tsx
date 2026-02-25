import {
    ChevronLeft,
    ChevronRight,
    Download,
    Eye,
    FileDown,
    FileText,
    Film,
    ImageIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { Adjunto } from '@/types';

type Props = {
    adjuntos: Adjunto[];
};

type TipoAdjunto = 'imagen' | 'video' | 'pdf' | 'otro';

function clasificarAdjunto(tipoMime: string): TipoAdjunto {
    if (tipoMime.startsWith('image/')) return 'imagen';
    if (tipoMime.startsWith('video/')) return 'video';
    if (tipoMime === 'application/pdf') return 'pdf';
    return 'otro';
}

function formatearTamano(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function IconoArchivo({ tipo }: { tipo: TipoAdjunto }) {
    switch (tipo) {
        case 'imagen':
            return <ImageIcon className="size-4 text-blue-500" />;
        case 'video':
            return <Film className="size-4 text-purple-500" />;
        case 'pdf':
            return <FileText className="size-4 text-red-500" />;
        default:
            return <FileDown className="size-4 text-muted-foreground" />;
    }
}

export default function VisorAdjuntos({ adjuntos }: Props) {
    const [visorAbierto, setVisorAbierto] = useState(false);
    const [indiceActual, setIndiceActual] = useState(0);

    const adjuntosVisuales = useMemo(
        () =>
            adjuntos.filter((a) => {
                const tipo = clasificarAdjunto(a.tipo_mime);
                return tipo === 'imagen' || tipo === 'video' || tipo === 'pdf';
            }),
        [adjuntos],
    );

    const imagenes = useMemo(
        () => adjuntos.filter((a) => clasificarAdjunto(a.tipo_mime) === 'imagen'),
        [adjuntos],
    );

    const archivos = useMemo(
        () => adjuntos.filter((a) => clasificarAdjunto(a.tipo_mime) !== 'imagen'),
        [adjuntos],
    );

    const abrirVisor = useCallback(
        (adjunto: Adjunto) => {
            const idx = adjuntosVisuales.findIndex((a) => a.id === adjunto.id);
            if (idx >= 0) {
                setIndiceActual(idx);
                setVisorAbierto(true);
            }
        },
        [adjuntosVisuales],
    );

    const anterior = useCallback(() => {
        setIndiceActual((prev) =>
            prev > 0 ? prev - 1 : adjuntosVisuales.length - 1,
        );
    }, [adjuntosVisuales.length]);

    const siguiente = useCallback(() => {
        setIndiceActual((prev) =>
            prev < adjuntosVisuales.length - 1 ? prev + 1 : 0,
        );
    }, [adjuntosVisuales.length]);

    useEffect(() => {
        if (!visorAbierto) return;

        function manejarTecla(e: KeyboardEvent) {
            if (e.key === 'ArrowLeft') anterior();
            if (e.key === 'ArrowRight') siguiente();
        }

        window.addEventListener('keydown', manejarTecla);
        return () => window.removeEventListener('keydown', manejarTecla);
    }, [visorAbierto, anterior, siguiente]);

    const adjuntoActual = adjuntosVisuales[indiceActual];
    const tipoActual = adjuntoActual
        ? clasificarAdjunto(adjuntoActual.tipo_mime)
        : null;

    return (
        <div className="space-y-3">
            <h4 className="text-sm font-medium">
                Adjuntos ({adjuntos.length})
            </h4>

            {/* Imagenes como thumbnails horizontales */}
            {imagenes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {imagenes.map((adjunto) => (
                        <button
                            key={adjunto.id}
                            type="button"
                            onClick={() => abrirVisor(adjunto)}
                            className="group relative h-24 overflow-hidden rounded-lg border border-border/60 bg-muted transition-all hover:border-primary hover:shadow-sm"
                        >
                            <img
                                src={adjunto.url}
                                alt={adjunto.nombre}
                                className="h-full w-auto min-w-24 max-w-48 object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                                <Eye className="size-5 text-white drop-shadow" />
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Archivos no-imagen como lista compacta */}
            {archivos.length > 0 && (
                <div className="divide-y divide-border/50 rounded-lg border border-border/60">
                    {archivos.map((adjunto) => {
                        const tipo = clasificarAdjunto(adjunto.tipo_mime);
                        const esVisual = tipo === 'video' || tipo === 'pdf';

                        const contenido = (
                            <div className="flex items-center gap-3 px-3 py-2.5">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                                    <IconoArchivo tipo={tipo} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">
                                        {adjunto.nombre}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatearTamano(adjunto.tamano)}
                                    </p>
                                </div>
                                {esVisual ? (
                                    <span className="shrink-0 text-xs text-muted-foreground">
                                        Ver
                                    </span>
                                ) : (
                                    <Download className="size-3.5 shrink-0 text-muted-foreground" />
                                )}
                            </div>
                        );

                        if (esVisual) {
                            return (
                                <button
                                    key={adjunto.id}
                                    type="button"
                                    onClick={() => abrirVisor(adjunto)}
                                    className="block w-full text-left transition-colors hover:bg-muted/50"
                                >
                                    {contenido}
                                </button>
                            );
                        }

                        return (
                            <a
                                key={adjunto.id}
                                href={adjunto.url}
                                download={adjunto.nombre}
                                className="block transition-colors hover:bg-muted/50"
                            >
                                {contenido}
                            </a>
                        );
                    })}
                </div>
            )}

            {/* Lightbox */}
            {adjuntosVisuales.length > 0 && (
                <Dialog open={visorAbierto} onOpenChange={setVisorAbierto}>
                    <DialogContent className="max-h-[95vh] gap-0 overflow-hidden p-0 sm:max-w-4xl [&>button:last-child]:text-white [&>button:last-child]:hover:text-white/80">
                        <DialogHeader className="sr-only">
                            <DialogTitle>
                                {adjuntoActual?.nombre}
                            </DialogTitle>
                            <DialogDescription>
                                Visualizador de archivo adjunto
                            </DialogDescription>
                        </DialogHeader>

                        {/* Contenido segun tipo */}
                        <div className="relative flex min-h-[50vh] items-center justify-center bg-neutral-950">
                            {tipoActual === 'imagen' && adjuntoActual && (
                                <img
                                    key={adjuntoActual.id}
                                    src={adjuntoActual.url}
                                    alt={adjuntoActual.nombre}
                                    className="max-h-[80vh] max-w-full object-contain"
                                />
                            )}

                            {tipoActual === 'video' && adjuntoActual && (
                                <video
                                    key={adjuntoActual.id}
                                    controls
                                    className="max-h-[80vh] max-w-full"
                                >
                                    <source
                                        src={adjuntoActual.url}
                                        type={adjuntoActual.tipo_mime}
                                    />
                                    Tu navegador no soporta la reproduccion de
                                    video.
                                </video>
                            )}

                            {tipoActual === 'pdf' && adjuntoActual && (
                                <iframe
                                    key={adjuntoActual.id}
                                    src={adjuntoActual.url}
                                    title={adjuntoActual.nombre}
                                    className="h-[80vh] w-full"
                                />
                            )}

                            {/* Navegacion lateral (solo multiples) */}
                            {adjuntosVisuales.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={anterior}
                                        className="absolute left-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                                    >
                                        <ChevronLeft className="size-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={siguiente}
                                        className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                                    >
                                        <ChevronRight className="size-5" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Barra inferior con info y acciones */}
                        <div className="flex items-center justify-between bg-neutral-900 px-4 py-2.5 text-white">
                            <div className="flex min-w-0 items-center gap-2">
                                <span className="truncate text-sm">
                                    {adjuntoActual?.nombre}
                                </span>
                                {adjuntosVisuales.length > 1 && (
                                    <span className="shrink-0 text-xs text-neutral-400">
                                        {indiceActual + 1} / {adjuntosVisuales.length}
                                    </span>
                                )}
                            </div>
                            {adjuntoActual && (
                                <a
                                    href={adjuntoActual.url}
                                    download={adjuntoActual.nombre}
                                    className="ml-3 flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
                                >
                                    <Download className="size-3.5" />
                                    Descargar
                                </a>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
