import type { User } from './auth';

export type EstadoTicket = 'Abierto' | 'Asignado' | 'EnProgreso' | 'EnEspera' | 'Resuelto' | 'Cerrado' | 'Cancelado';
export type Canal = 'Web' | 'WhatsApp' | 'Telefono' | 'Correo' | 'Presencial';
export type Dia = 'Lunes' | 'Martes' | 'Miercoles' | 'Jueves' | 'Viernes' | 'Sabado' | 'Domingo';

export type HorarioAuxiliar = {
    id: number;
    dia: Dia;
    hora_inicio: string;
    hora_fin: string;
};

export type Area = {
    id: number;
    nombre: string;
    edificio: string | null;
    nivel_prioridad: number;
    activo: boolean;
};

export type Categoria = {
    id: number;
    nombre: string;
    descripcion: string | null;
    padre_id: number | null;
    icono: string | null;
    activo: boolean;
};

export type Prioridad = {
    id: number;
    nombre: string;
    color: string;
    horas_respuesta: number;
    horas_resolucion: number;
    nivel: number;
    activo: boolean;
};

export type Ubicacion = {
    id: number;
    nombre: string;
    edificio: string | null;
    piso: string | null;
    salon: string | null;
    descripcion: string | null;
    area_id: number | null;
    activo: boolean;
};

export type CategoriaSimple = Pick<Categoria, 'id' | 'nombre'>;

export type AuxiliarAdmin = {
    id: number;
    name: string;
    email: string;
    area_id: number | null;
    whatsapp_telefono: string | null;
    especialidades: string | null;
    disponible: boolean;
    area?: { id: number; nombre: string } | null;
    categorias_especialidad?: CategoriaSimple[];
    horarios_disponibilidad?: HorarioAuxiliar[];
};

export type CatalogosDashboard = {
    areas: Pick<Area, 'id' | 'nombre'>[];
    categorias: Pick<Categoria, 'id' | 'nombre' | 'padre_id'>[];
    prioridades: Pick<Prioridad, 'id' | 'nombre' | 'color' | 'nivel'>[];
    ubicaciones: Pick<Ubicacion, 'id' | 'nombre' | 'edificio' | 'piso' | 'area_id'>[];
    canales: Canal[];
    usuarios: { id: number; name: string; email: string }[];
};

export type CategoriaConPadre = Categoria & {
    padre?: Pick<Categoria, 'id' | 'nombre'> | null;
};

export type UbicacionConArea = Ubicacion & {
    area?: Pick<Area, 'id' | 'nombre'> | null;
};

export type Ticket = {
    id: number;
    numero: string;
    titulo: string;
    descripcion: string;
    solicitante_id: number;
    creador_id: number;
    area_id: number;
    categoria_id: number;
    prioridad_id: number;
    ubicacion_id: number | null;
    canal: Canal;
    estado: EstadoTicket;
    auxiliar_id: number | null;
    asignado_por: number | null;
    fecha_asignacion: string | null;
    fecha_resolucion: string | null;
    fecha_cierre: string | null;
    solucion: string | null;
    calificacion: number | null;
    comentario_cal: string | null;
    fecha_limite: string | null;
    created_at: string;
    updated_at: string;
    // Relaciones cargadas (eager loading)
    solicitante?: Pick<User, 'id' | 'name'>;
    auxiliar?: Pick<User, 'id' | 'name'> | null;
    prioridad?: Pick<Prioridad, 'id' | 'nombre' | 'color'>;
    categoria?: Pick<Categoria, 'id' | 'nombre'>;
};

export type Estadisticas = {
    total: number;
    abiertos: number;
    en_progreso: number;
    resueltos: number;
};

export type DatosPaginados<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
};
