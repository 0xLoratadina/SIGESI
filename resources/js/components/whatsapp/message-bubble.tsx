import {
    Bot,
    Check,
    CheckCheck,
    Download,
    FileText,
    Mic,
    Pause,
    Play,
    Reply,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Mensaje } from '@/pages/admin/whatsapp/index';

type Props = {
    mensaje: Mensaje;
    onMediaClick?: (url: string, tipo: 'imagen' | 'video') => void;
    onResponder?: (mensaje: Mensaje) => void;
};

export default function MessageBubble({
    mensaje,
    onMediaClick,
    onResponder,
}: Props) {
    const esEnviado = mensaje.tipo === 'enviado';
    const esBot = mensaje.es_bot === true;
    const tieneMedia = mensaje.media_url && mensaje.media_tipo;

    return (
        <div
            className={`group flex ${esEnviado ? 'justify-end' : 'justify-start'}`}
        >
            {/* Botón reply - aparece al hover (lado izquierdo para enviados) */}
            {esEnviado && onResponder && (
                <button
                    onClick={() => onResponder(mensaje)}
                    className="mr-1 self-center rounded-full p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted"
                    title="Responder"
                >
                    <Reply className="h-4 w-4 text-muted-foreground" />
                </button>
            )}
            <div
                className={`relative max-w-[70%] rounded-lg px-3 py-2 ${
                    esEnviado
                        ? 'border border-blue-200 bg-blue-50 dark:border-blue-700/40 dark:bg-blue-900/30'
                        : 'bg-muted'
                }`}
            >
                {/* Quote box - mensaje citado */}
                {mensaje.respuesta_a && (
                    <div
                        className={`mb-2 rounded-md border-l-2 bg-background/60 p-2 dark:bg-background/30 ${
                            mensaje.respuesta_a.tipo === 'enviado'
                                ? 'border-blue-500'
                                : 'border-primary'
                        }`}
                    >
                        <p
                            className={`text-[11px] font-medium ${
                                mensaje.respuesta_a.tipo === 'enviado'
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-primary'
                            }`}
                        >
                            {mensaje.respuesta_a.tipo === 'enviado'
                                ? 'Tú'
                                : 'Contacto'}
                        </p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                            {mensaje.respuesta_a.contenido}
                        </p>
                    </div>
                )}

                {/* Etiqueta Bot IA */}
                {esBot && (
                    <div className="mb-2 flex items-center gap-1.5">
                        <Bot className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            Bot IA
                        </span>
                    </div>
                )}

                {/* Media del mensaje */}
                {tieneMedia && (
                    <MediaContent
                        url={mensaje.media_url!}
                        tipo={mensaje.media_tipo!}
                        contenido={mensaje.contenido}
                        onMediaClick={onMediaClick}
                    />
                )}

                {/* Contenido del mensaje (texto) */}
                {mensaje.contenido &&
                    !isMediaPlaceholder(mensaje.contenido) && (
                        <p
                            className={`text-sm break-words whitespace-pre-wrap ${tieneMedia ? 'mt-2' : ''}`}
                        >
                            {mensaje.contenido}
                        </p>
                    )}

                {/* Hora y estado */}
                <div
                    className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                        esEnviado
                            ? 'text-blue-600/70 dark:text-blue-400/70'
                            : 'text-muted-foreground'
                    }`}
                >
                    <span>{mensaje.hora}</span>
                    {esEnviado &&
                        (mensaje.leido ? (
                            <CheckCheck className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        ) : (
                            <Check className="h-3 w-3" />
                        ))}
                </div>
            </div>
            {/* Botón reply - aparece al hover (lado derecho para recibidos) */}
            {!esEnviado && onResponder && (
                <button
                    onClick={() => onResponder(mensaje)}
                    className="ml-1 self-center rounded-full p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted"
                    title="Responder"
                >
                    <Reply className="h-4 w-4 text-muted-foreground" />
                </button>
            )}
        </div>
    );
}

function isMediaPlaceholder(contenido: string): boolean {
    return /^\[(Imagen|Video|Audio|Documento|Sticker).*\]$/.test(contenido);
}

// ─── Reproductor de audio estilo WhatsApp ───────────────────────────────────

function formatDuration(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function AudioPlayer({ url }: { url: string }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [velocidad, setVelocidad] = useState(1);
    const [isDragging, setIsDragging] = useState(false);

    const progreso = duration > 0 ? (currentTime / duration) * 100 : 0;

    const togglePlay = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
    }, [isPlaying]);

    const cambiarVelocidad = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const velocidades = [1, 1.5, 2];
        const idx = velocidades.indexOf(velocidad);
        const nueva = velocidades[(idx + 1) % velocidades.length];
        audio.playbackRate = nueva;
        setVelocidad(nueva);
    }, [velocidad]);

    const seekTo = useCallback(
        (clientX: number) => {
            const bar = progressRef.current;
            const audio = audioRef.current;
            if (!bar || !audio || !duration) return;
            const rect = bar.getBoundingClientRect();
            const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
            const ratio = x / rect.width;
            audio.currentTime = ratio * duration;
            setCurrentTime(audio.currentTime);
        },
        [duration],
    );

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            setIsDragging(true);
            seekTo(e.clientX);
        },
        [seekTo],
    );

    useEffect(() => {
        if (!isDragging) return;

        function handleMouseMove(e: MouseEvent) {
            seekTo(e.clientX);
        }
        function handleMouseUp() {
            setIsDragging(false);
        }
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, seekTo]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        function onLoadedMetadata() {
            setDuration(audio!.duration);
        }
        function onTimeUpdate() {
            if (!isDragging) setCurrentTime(audio!.currentTime);
        }
        function onPlay() {
            setIsPlaying(true);
        }
        function onPause() {
            setIsPlaying(false);
        }
        function onEnded() {
            setIsPlaying(false);
            setCurrentTime(0);
        }

        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('ended', onEnded);

        if (audio.readyState >= 1) {
            setDuration(audio.duration);
        }

        return () => {
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('ended', onEnded);
        };
    }, [isDragging]);

    return (
        <div className="flex min-w-56 items-center gap-2 py-1">
            <audio ref={audioRef} src={url} preload="metadata" />

            <button
                onClick={togglePlay}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 transition-colors hover:bg-primary/20"
            >
                {isPlaying ? (
                    <Pause className="h-5 w-5 text-primary" />
                ) : (
                    <Play className="ml-0.5 h-5 w-5 text-primary" />
                )}
            </button>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div
                    ref={progressRef}
                    className="group relative h-1.5 cursor-pointer rounded-full"
                    onMouseDown={handleMouseDown}
                >
                    <div className="absolute inset-0 rounded-full bg-primary/15" />
                    <div
                        className={`absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] ${isDragging ? '' : 'duration-100'}`}
                        style={{ width: `${progreso}%` }}
                    />
                    <div
                        className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-primary shadow-sm transition-[left] ${isDragging ? 'scale-125' : 'scale-100 group-hover:scale-110'}`}
                        style={{ left: `calc(${progreso}% - 6px)` }}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                        {isPlaying || currentTime > 0
                            ? formatDuration(currentTime)
                            : formatDuration(duration)}
                    </span>
                    {isPlaying && (
                        <button
                            onClick={cambiarVelocidad}
                            className="rounded px-1 text-[10px] font-semibold text-primary transition-opacity hover:opacity-70"
                        >
                            {velocidad}x
                        </button>
                    )}
                    {!isPlaying && (
                        <Mic className="h-3 w-3 text-primary opacity-60" />
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── MediaContent ───────────────────────────────────────────────────────────

type MediaContentProps = {
    url: string;
    tipo: 'imagen' | 'video' | 'audio' | 'documento' | 'sticker';
    contenido: string;
    onMediaClick?: (url: string, tipo: 'imagen' | 'video') => void;
};

function MediaContent({
    url,
    tipo,
    contenido,
    onMediaClick,
}: MediaContentProps) {
    switch (tipo) {
        case 'imagen':
            return (
                <img
                    src={url}
                    alt="Imagen"
                    className="max-h-64 max-w-full cursor-pointer rounded-md object-contain transition-opacity hover:opacity-90"
                    loading="lazy"
                    onClick={() => onMediaClick?.(url, 'imagen')}
                />
            );

        case 'sticker':
            return (
                <img
                    src={url}
                    alt="Sticker"
                    className="max-h-32 max-w-32 object-contain"
                    loading="lazy"
                />
            );

        case 'video':
            return (
                <div
                    className="group relative cursor-pointer"
                    onClick={() => onMediaClick?.(url, 'video')}
                >
                    <video
                        src={url}
                        className="max-h-64 max-w-full rounded-md"
                        preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/20 transition-colors group-hover:bg-black/30">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50">
                            <Play className="ml-0.5 h-6 w-6 text-white" />
                        </div>
                    </div>
                </div>
            );

        case 'audio':
            return <AudioPlayer url={url} />;

        case 'documento': {
            const nombreArchivo = extractFileName(contenido);
            return (
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-md bg-background/50 p-2 transition-colors hover:bg-background/80"
                >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                            {nombreArchivo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Documento
                        </p>
                    </div>
                    <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
                </a>
            );
        }

        default:
            return null;
    }
}

function extractFileName(contenido: string): string {
    const match = contenido.match(/\[Documento:\s*(.+?)\]/);
    return match ? match[1] : 'Documento';
}
