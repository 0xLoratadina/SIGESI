import { Form, Head } from '@inertiajs/react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/routes/login';

type Props = {
    status?: string;
    canRegister: boolean;
};

export default function Login({ status, canRegister }: Props) {
    const [mostrarPassword, setMostrarPassword] = useState(false);

    return (
        <AuthLayout>
            <Head title="Iniciar sesion" />

            <div className="mb-8 text-center">
                <h2 className="text-2xl font-semibold tracking-tight">
                    Bienvenido
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                    Ingresa tus credenciales para continuar
                </p>
            </div>

            {status && (
                <div className="mb-4 rounded-lg bg-green-50 p-3 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="space-y-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    Correo electronico
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="email"
                                        placeholder="correo@ejemplo.com"
                                        className="pl-10"
                                    />
                                </div>
                                <InputError message={errors.email} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Contrasena</Label>
                                <div className="relative">
                                    <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={
                                            mostrarPassword
                                                ? 'text'
                                                : 'password'
                                        }
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        className="px-10"
                                    />
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                                        onClick={() =>
                                            setMostrarPassword(!mostrarPassword)
                                        }
                                    >
                                        {mostrarPassword ? (
                                            <EyeOff className="size-4" />
                                        ) : (
                                            <Eye className="size-4" />
                                        )}
                                    </button>
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label
                                    htmlFor="remember"
                                    className="text-sm font-normal"
                                >
                                    Mantener sesion iniciada
                                </Label>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            tabIndex={4}
                            disabled={processing}
                            data-test="login-button"
                        >
                            {processing && <Spinner />}
                            Iniciar sesion
                        </Button>

                        {canRegister && (
                            <p className="text-center text-xs text-muted-foreground">
                                ¿No tienes cuenta? Contacta al administrador
                            </p>
                        )}
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
