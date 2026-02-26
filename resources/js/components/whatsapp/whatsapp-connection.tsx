import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
    conectar,
    estado as estadoRoute,
    limpiarDatos as limpiarDatosRoute,
    qrcode as qrcodeRoute,
} from '@/actions/App/Http/Controllers/Admin/WhatsAppController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

type EstadoConexion = 'desconectado' | 'conectando' | 'conectado';

type Props = {
    estadoConexion: EstadoConexion;
    onEstadoCambiado?: (nuevoEstado: EstadoConexion) => void;
};

const POLLING_ESTADO_INTERVAL = 3000;

export default function WhatsAppConnection({
    estadoConexion: estadoInicial,
    onEstadoCambiado,
}: Props) {
    const [estado, setEstado] = useState<EstadoConexion>(estadoInicial);
    const [dialogAbierto, setDialogAbierto] = useState(false);
    const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
    const [cargando, setCargando] = useState(false);
    const [desconectando, setDesconectando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        setEstado(estadoInicial);
    }, [estadoInicial]);

    useEffect(() => {
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    const detenerPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    const verificarEstado = useCallback(async () => {
        try {
            const res = await axios.get(estadoRoute().url);
            if (res.data.conectado) {
                setEstado('conectado');
                setQrCodeBase64(null);
                detenerPolling();
                setDialogAbierto(false);
                onEstadoCambiado?.('conectado');
            }
        } catch {
            // ignore
        }
    }, [detenerPolling, onEstadoCambiado]);

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

    const iniciarPolling = useCallback(() => {
        detenerPolling();
        let tick = 0;
        pollingRef.current = setInterval(() => {
            tick++;
            if (tick % 2 === 0) refrescarQr();
            verificarEstado();
        }, POLLING_ESTADO_INTERVAL);
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
                setEstado('conectando');
                onEstadoCambiado?.('conectando');
                iniciarPolling();
            } else if (res.data.error) {
                setError(res.data.error);
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response?.data?.error) {
                setError(err.response.data.error);
            } else {
                setError('Error al conectar');
            }
        } finally {
            setCargando(false);
        }
    };

    const handleDesconectar = async () => {
        setDesconectando(true);
        setError(null);
        try {
            await axios.post(limpiarDatosRoute().url);
            setEstado('desconectado');
            setQrCodeBase64(null);
            detenerPolling();
            onEstadoCambiado?.('desconectado');
        } catch {
            setError('Error al desconectar');
        } finally {
            setDesconectando(false);
        }
    };

    const handleDialogChange = (open: boolean) => {
        setDialogAbierto(open);
        if (!open) {
            detenerPolling();
            setError(null);
        }
    };

    useEffect(() => {
        if (dialogAbierto && estado === 'conectando') iniciarPolling();
        if (!dialogAbierto) detenerPolling();
    }, [dialogAbierto, estado, iniciarPolling, detenerPolling]);

    const pasos = [
        'Abre WhatsApp en tu telefono.',
        'Toca Menu o Ajustes y selecciona Dispositivos vinculados.',
        'Toca Vincular un dispositivo.',
        'Apunta tu telefono a esta pantalla para escanear el codigo QR.',
    ];

    return (
        <Dialog open={dialogAbierto} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
                <button className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-accent">
                    <div
                        className={`h-2 w-2 rounded-full ${estado === 'conectado'
                            ? 'bg-green-500'
                            : estado === 'conectando'
                                ? 'animate-pulse bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                    />
                    <span className="text-xs text-muted-foreground">
                        {estado === 'conectado'
                            ? 'Conectado'
                            : estado === 'conectando'
                                ? 'Conectando...'
                                : 'Desconectado'}
                    </span>
                </button>
            </DialogTrigger>

            <DialogContent
                className={
                    estado === 'conectando'
                        ? 'sm:max-w-[820px] gap-0 p-0 overflow-hidden'
                        : 'sm:max-w-[400px]'
                }
            >
                {/* Estado: QR visible — layout de dos columnas */}
                {estado === 'conectando' && (
                    <div className="flex">
                        {/* Columna izquierda: pasos — ancho fijo */}
                        <div className="flex w-[400px] shrink-0 flex-col justify-center gap-8 px-12 py-12">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Pasos para iniciar sesion
                            </h2>

                            <ol className="flex flex-col gap-5">
                                {pasos.map((paso, i) => (
                                    <li key={i} className="flex items-start gap-4">
                                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-foreground/25 text-xs font-medium text-foreground/50">
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

                        {/* Columna derecha: QR — ocupa el resto */}
                        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12">
                            <div className="rounded-xl border bg-white p-3 shadow-sm">
                                {qrCodeBase64 ? (
                                    <img
                                        src={qrCodeBase64}
                                        alt="Codigo QR"
                                        className="h-64 w-64"
                                    />
                                ) : (
                                    <div className="flex h-64 w-64 items-center justify-center">
                                        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                            <p className="text-center text-xs text-muted-foreground">
                                El codigo se actualiza automaticamente
                            </p>
                        </div>
                    </div>
                )}

                {/* Estado: desconectado */}
                {estado === 'desconectado' && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Conexion WhatsApp</DialogTitle>
                            <DialogDescription>
                                Vincula tu cuenta escaneando un codigo QR desde tu telefono.
                            </DialogDescription>
                        </DialogHeader>
                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}
                        <DialogFooter>
                            <Button onClick={handleConectar} disabled={cargando}>
                                {cargando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {cargando ? 'Generando...' : 'Conectar'}
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {/* Estado: conectado */}
                {estado === 'conectado' && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Conexion WhatsApp</DialogTitle>
                            <DialogDescription>
                                La sesion esta activa. Para desvincular este dispositivo cierra la sesion desde aqui o desde tu telefono.
                            </DialogDescription>
                        </DialogHeader>
                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={handleDesconectar}
                                disabled={desconectando}
                            >
                                {desconectando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {desconectando ? 'Cerrando sesion...' : 'Cerrar sesion'}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
