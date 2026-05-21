// ── Roles del sistema ────────────────────────────────────────
export type Rol = 'admin' | 'vendedor' | 'contador' | 'cliente';

// ── Usuario (login / registro) ──────────────────────────────
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  password: string;
  rol: Rol;
  profile_image_url: string;
  empresa: string;
  ruc: string;
  telefono: string;
  direccion: string;
  activo: boolean;
  created_at: string;
}

// ── Producto del catálogo ────────────────────────────────────
export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  image_url: string;
  precio: number;
  impuesto: number;
  stock: number;
  categoria: string;
  activo: boolean;
  created_at: string;
}

// ── Línea de detalle de factura ──────────────────────────────
export interface DetalleFactura {
  id: string;
  producto_id: string;
  producto_nombre: string;
  producto_codigo: string;
  cantidad: number;
  precio_unitario: number;
  impuesto: number;
  subtotal: number;
}

// ── Factura electrónica ──────────────────────────────────────
export interface Factura {
  id: string;
  numero: string;
  cliente_id: string;
  cliente_nombre: string;
  cliente_ruc: string;
  vendedor_id: string;
  vendedor_nombre: string;
  fecha: string;
  subtotal: number;
  impuesto_total: number;
  total: number;
  estado: 'pendiente' | 'emitida' | 'pagada' | 'anulada';
  metodo_pago: string;
  notas: string;
  detalles: DetalleFactura[];
  created_at: string;
}

// ── Sesión activa ────────────────────────────────────────────
export interface Sesion {
  usuario: Usuario;
  token: string;
}
