import { Bot, Check, CheckCheck } from 'lucide-react';
import type { Mensaje } from '@/pages/admin/whatsapp/index';

type Props = {
    mensaje: Mensaje;
};

export default function MessageBubble({ mensaje }: Props) {
    const esEnviado = mensaje.tipo === 'enviado';
    const esBot = mensaje.es_bot === true;

    return (
        <div className={`flex ${esEnviado ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`relative max-w-[70%] rounded-lg px-3 py-2 ${
                    esEnviado
                        ? 'bg-blue-50 border border-blue-200 dark:bg-blue-900/30 dark:border-blue-700/40'
                        : 'bg-muted'
                }`}
            >
                {/* Etiqueta Bot IA */}
                {esBot && (
                    <div className="flex items-center gap-1.5 mb-2">
                        <Bot className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Bot IA</span>
                    </div>
                )}

                {/* Contenido del mensaje */}
                <p className="text-sm whitespace-pre-wrap break-words">{mensaje.contenido}</p>

                {/* Hora y estado */}
                <div
                    className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                        esEnviado ? 'text-blue-600/70 dark:text-blue-400/70' : 'text-muted-foreground'
                    }`}
                >
                    <span>{mensaje.hora}</span>
                    {esEnviado && (
                        mensaje.leido ? (
                            <CheckCheck className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        ) : (
                            <Check className="h-3 w-3" />
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
