import type { EstadoTicket } from '@/types';

const clasesEstado: Record<EstadoTicket, string> = {
    Abierto: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    Asignado: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    EnProgreso: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    EnEspera: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    Resuelto: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    Cerrado: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    Cancelado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const etiquetasEstado: Record<EstadoTicket, string> = {
    Abierto: 'Abierto',
    Asignado: 'Asignado',
    EnProgreso: 'En Progreso',
    EnEspera: 'En Espera',
    Resuelto: 'Resuelto',
    Cerrado: 'Cerrado',
    Cancelado: 'Cancelado',
};

export function obtenerClaseEstado(estado: EstadoTicket): string {
    return clasesEstado[estado] ?? '';
}

export function obtenerEtiquetaEstado(estado: EstadoTicket): string {
    return etiquetasEstado[estado] ?? estado;
}

export function formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export function formatearFechaCorta(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
    });
}
