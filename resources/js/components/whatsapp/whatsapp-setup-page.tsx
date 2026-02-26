import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
    conectar,
    estado as estadoRoute,
    qrcode as qrcodeRoute,
} from '@/actions/App/Http/Controllers/Admin/WhatsAppController';
import { Button } from '@/components/ui/button';

type EstadoConexion = 'desconectado' | 'conectando' | 'conectado';

type Props = {
    onEstadoCambiado?: (nuevoEstado: EstadoConexion) => void;
};

const POLLING_INTERVAL = 3000;

const pasos = [
    'Abre WhatsApp en tu telefono.',
    'Toca Menu o Ajustes y selecciona Dispositivos vinculados.',
    'Toca Vincular un dispositivo.',
    'Apunta tu telefono a esta pantalla para escanear el codigo QR.',
];

export default function WhatsAppSetupPage({ onEstadoCambiado }: Props) {
    const [fase, setFase] = useState<'idle' | 'conectando'>('idle');
    const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const detenerPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => detenerPolling();
    }, [detenerPolling]);

    const refrescarQr = useCallback(async () => {
        try {
            const res = await axios.get(qrcodeRoute().url);
            const qr = res.data.qrcode;
            const base64 = typeof qr === 'string' ? qr : qr?.base64;
            if (base64) setQrCodeBase64(base64);
        } catch {
            // ignore
        }
    }, []);

    const verificarEstado = useCallback(async () => {
        try {
            const res = await axios.get(estadoRoute().url);
            if (res.data.conectado) {
                detenerPolling();
                onEstadoCambiado?.('conectado');
            }
        } catch {
            // ignore
        }
    }, [detenerPolling, onEstadoCambiado]);

    const iniciarPolling = useCallback(() => {
        detenerPolling();
        let tick = 0;
        pollingRef.current = setInterval(() => {
            tick++;
            if (tick % 2 === 0) refrescarQr();
            verificarEstado();
        }, POLLING_INTERVAL);
    }, [detenerPolling, refrescarQr, verificarEstado]);

    const handleConectar = async () => {
        setCargando(true);
        setError(null);
        try {
            const res = await axios.post(conectar().url);
            if (res.data.qrcode) {
                const qr = res.data.qrcode;
                const base64 = typeof qr === 'string' ? qr : qr?.base64;
                setQrCodeBase64(base64 ?? null);
                setFase('conectando');
                onEstadoCambiado?.('conectando');
                iniciarPolling();
            } else if (res.data.error) {
                setError(res.data.error);
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response?.data?.error) {
                setError(err.response.data.error);
            } else {
                setError('Error al conectar. Verifica que Evolution API este corriendo.');
            }
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="flex h-full w-full">
            {/* Columna izquierda — pasos */}
            <div className="flex w-[420px] shrink-0 flex-col justify-center gap-10 px-16 py-16">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-semibold tracking-tight">
                        Pasos para iniciar sesion
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Vincula tu cuenta de WhatsApp para comenzar a recibir mensajes.
                    </p>
                </div>

                <ol className="flex flex-col gap-6">
                    {pasos.map((paso, i) => (
                        <li key={i} className="flex items-start gap-4">
                            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-foreground/20 text-sm font-medium text-foreground/50">
                                {i + 1}
                            </span>
                            <span className="text-sm leading-relaxed text-muted-foreground">
                                {paso}
                            </span>
                        </li>
                    ))}
                </ol>

                {error && (
                    <p className="text-sm text-destructive">{error}</p>
                )}
            </div>

            {/* Divisor vertical */}
            <div className="w-px shrink-0 bg-border" />

            {/* Columna derecha — QR o botón */}
            <div className="flex flex-1 flex-col items-center justify-center gap-6">
                {fase === 'idle' ? (
                    <div className="flex flex-col items-center gap-6">
                        {/* Placeholder QR con botón centrado */}
                        <div className="flex h-64 w-64 items-center justify-center rounded-xl border bg-muted/30">
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="grid grid-cols-3 gap-1 opacity-20">
                                    {Array.from({ length: 9 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`rounded-sm bg-foreground ${
                                                [0, 2, 4, 6, 8].includes(i)
                                                    ? 'h-8 w-8'
                                                    : 'h-4 w-4'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <Button onClick={handleConectar} disabled={cargando} size="lg">
                            {cargando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {cargando ? 'Generando codigo QR...' : 'Conectar WhatsApp'}
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <div className="rounded-xl border bg-white p-3 shadow-sm">
                            {qrCodeBase64 ? (
                                <img
                                    src={qrCodeBase64}
                                    alt="Codigo QR"
                                    className="h-64 w-64"
                                />
                            ) : (
                                <div className="flex h-64 w-64 items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Escanea el codigo con tu telefono
                        </p>
                        <p className="text-xs text-muted-foreground/60">
                            El codigo se actualiza automaticamente
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
