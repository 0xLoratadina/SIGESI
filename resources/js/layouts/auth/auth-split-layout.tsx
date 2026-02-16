import AppLogoIcon from '@/components/app-logo-icon';

type Props = {
    children: React.ReactNode;
};

export default function AuthSplitLayout({ children }: Props) {
    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            {/* Lado izquierdo - Branding minimalista */}
            <div className="relative hidden overflow-hidden bg-neutral-950 lg:flex">
                {/* Cuadricula sutil */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:48px_48px]" />

                {/* Brillo sutil central */}
                <div className="absolute left-1/2 top-1/2 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.02] blur-3xl" />

                {/* Contenido */}
                <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-12">
                    <div className="flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-2xl">
                        <AppLogoIcon className="size-9 fill-current text-white" />
                    </div>
                    <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">SIGESI</h1>
                    <p className="mt-1.5 text-sm text-neutral-500">
                        Gestion de Solicitudes e Incidencias
                    </p>
                </div>
            </div>

            {/* Lado derecho - Formulario */}
            <div className="flex flex-col bg-muted/30 p-6 md:p-10">
                {/* Logo para mobile */}
                <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-neutral-950">
                        <AppLogoIcon className="size-6 fill-current text-white" />
                    </div>
                    <span className="text-lg font-semibold">SIGESI</span>
                </div>

                {/* Contenedor central */}
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-sm">{children}</div>
                </div>
            </div>
        </div>
    );
}
