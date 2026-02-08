import { Head, Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { dashboard, login } from '@/routes';
import type { SharedData } from '@/types';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="SIGESI" />
            <div className="flex min-h-svh flex-col items-center justify-center bg-background p-6">
                <div className="flex max-w-md flex-col items-center gap-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary">
                        <AppLogoIcon className="size-10 fill-current text-primary-foreground" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">
                            SIGESI
                        </h1>
                    </div>

                    <div className="flex gap-3 pt-2">
                        {auth.user ? (
                            <Button asChild size="lg">
                                <Link href={dashboard()}>
                                    Ir al Dashboard
                                </Link>
                            </Button>
                        ) : (
                            <Button asChild size="lg">
                                <Link href={login()}>
                                    Iniciar sesion
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
