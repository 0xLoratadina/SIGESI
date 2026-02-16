export type * from './auth';
export type * from './models';
export type * from './navigation';
export type * from './ui';

import type { Auth } from './auth';

export type Credenciales = {
    nombre: string;
    email: string;
    password: string;
    rol: string;
};

export type SharedData = {
    name: string;
    auth: Auth;
    sidebarOpen: boolean;
    flash: {
        credenciales?: Credenciales | null;
    };
    [key: string]: unknown;
};
