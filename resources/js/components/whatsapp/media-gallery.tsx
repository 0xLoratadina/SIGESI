import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Mensaje } from '@/pages/admin/whatsapp/index';

export type MediaItem = {
    url: string;
    tipo: 'imagen' | 'video';
    mensajeId: string;
};

type Props = {
    mensajes: Mensaje[];
    urlActiva: string;
    onClose: () => void;
};

export default function MediaGallery({ mensajes, urlActiva, onClose }: Props) {
    const thumbnailsRef = useRef<HTMLDivElement>(null);

    // Recopilar todas las imágenes y videos del chat
    const mediaItems = useMemo<MediaItem[]>(() => {
        return mensajes
            .filter(
                (m) =>
                    m.media_url &&
                    (m.media_tipo === 'imagen' || m.media_tipo === 'video'),
            )
            .map((m) => ({
                url: m.media_url!,
                tipo: m.media_tipo as 'imagen' | 'video',
                mensajeId: m.id,
            }));
    }, [mensajes]);

    // Encontrar el índice del media activo
    const [indiceActivo, setIndiceActivo] = useState(() => {
        const idx = mediaItems.findIndex((m) => m.url === urlActiva);
        return idx >= 0 ? idx : 0;
    });

    const mediaActual = mediaItems[indiceActivo];

    const irAnterior = useCallback(() => {
        setIndiceActivo((prev) =>
            prev > 0 ? prev - 1 : mediaItems.length - 1,
        );
    }, [mediaItems.length]);

    const irSiguiente = useCallback(() => {
        setIndiceActivo((prev) =>
            prev < mediaItems.length - 1 ? prev + 1 : 0,
        );
    }, [mediaItems.length]);

    // Teclado: Escape, flechas
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') irAnterior();
            if (e.key === 'ArrowRight') irSiguiente();
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose, irAnterior, irSiguiente]);

    // Scroll del thumbnail activo al centro
    useEffect(() => {
        const container = thumbnailsRef.current;
        if (!container) return;
        const thumb = container.children[indiceActivo] as
            | HTMLElement
            | undefined;
        if (thumb) {
            thumb.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center',
            });
        }
    }, [indiceActivo]);

    if (!mediaActual) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between px-4 py-3">
                <span className="text-sm text-white/70">
                    {indiceActivo + 1} / {mediaItems.length}
                </span>
                <button
                    onClick={onClose}
                    className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Contenido principal */}
            <div className="relative flex min-h-0 flex-1 items-center justify-center px-16">
                {/* Botón anterior */}
                {mediaItems.length > 1 && (
                    <button
                        onClick={irAnterior}
                        className="absolute left-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                )}

                {/* Media */}
                <div className="flex max-h-full max-w-full items-center justify-center">
                    {mediaActual.tipo === 'imagen' ? (
                        <img
                            key={mediaActual.url}
                            src={mediaActual.url}
                            alt="Imagen"
                            className="max-h-[calc(100vh-180px)] max-w-full rounded-lg object-contain"
                        />
                    ) : (
                        <video
                            key={mediaActual.url}
                            src={mediaActual.url}
                            controls
                            autoPlay
                            className="max-h-[calc(100vh-180px)] max-w-full rounded-lg"
                        >
                            Tu navegador no soporta el elemento de video.
                        </video>
                    )}
                </div>

                {/* Botón siguiente */}
                {mediaItems.length > 1 && (
                    <button
                        onClick={irSiguiente}
                        className="absolute right-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                )}
            </div>

            {/* Thumbnails */}
            {mediaItems.length > 1 && (
                <div className="shrink-0 border-t border-white/10 bg-black/60 px-4 py-2">
                    <div
                        ref={thumbnailsRef}
                        className="scrollbar-thin flex justify-center gap-1 overflow-x-auto"
                    >
                        {mediaItems.map((item, idx) => (
                            <button
                                key={item.mensajeId}
                                onClick={() => setIndiceActivo(idx)}
                                className={`shrink-0 overflow-hidden rounded transition-all ${
                                    idx === indiceActivo
                                        ? 'opacity-100 ring-2 ring-white'
                                        : 'opacity-50 hover:opacity-80'
                                }`}
                            >
                                {item.tipo === 'imagen' ? (
                                    <img
                                        src={item.url}
                                        alt=""
                                        className="h-14 w-14 object-cover"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="flex h-14 w-14 items-center justify-center bg-white/10">
                                        <span className="text-[10px] text-white">
                                            Video
                                        </span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
