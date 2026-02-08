export type Rol = 'Administrador' | 'Tecnico' | 'Solicitante';

export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    rol: Rol;
    departamento_id: number | null;
    telefono: string | null;
    num_empleado: string | null;
    cargo: string | null;
    activo: boolean;
    disponible: boolean;
    max_tickets: number;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
