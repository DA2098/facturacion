// ═══════════════════════════════════════════════════════════════
// DB.TS — Cliente HTTP del Frontend (CONSUMIDOR de la API)
// ═══════════════════════════════════════════════════════════════
//
// NOTA IMPORTANTE:
// Este archivo pertenece al frontend y actúa únicamente como cliente
// HTTP que consume la API implementada en `server/`. No debe contener
// rutas ni lógica de servidor. Toda la implementación de endpoints y
// la lógica de acceso a la base de datos debe residir en
// `server/src/*` (por ejemplo `server/src/routes/*` y `server/src/db.ts`).
//
// La URL base de la API se obtiene de `VITE_API_URL` o por defecto
// `http://localhost:3001`.
//
// Si necesitas añadir un endpoint, créalo en el backend y luego
// consume ese endpoint por aquí (añadiendo la función correspondiente).
//
// EJEMPLO: backend -> `POST /api/productos` (server/src/routes/productos.ts)
// frontend -> `createProducto()` aquí (src/services/db.ts)
//
// Mantén la separación de responsabilidades: Backend = API y datos;
// Frontend = UI + cliente HTTP.

import type { Usuario, Producto, Factura, DetalleFactura, AutopagoConfig } from '../types/index.ts';

const API = (import.meta as any).env?.VITE_API_URL || '';

function clearLegacyMockData() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem('fy_seeded');
  localStorage.removeItem('fy_usuarios');
  localStorage.removeItem('fy_productos');
  localStorage.removeItem('fy_facturas');
}

clearLegacyMockData();

/**
 * request
 * Helper HTTP que realiza llamadas al backend.
 * - `path`: ruta relativa al `API` base (ej: `/api/usuarios`).
 * - `init`: `RequestInit` opcional para método, body, headers.
 * Retorna el JSON parseado o lanza Error con el mensaje devuelto por el servidor.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    let message = 'Error';
    try {
      const data = await res.json();
      message = data?.error || message;
    } catch {
      message = await res.text().catch(() => message);
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function mapFactura(row: any): Factura {
  return {
    id: row.id,
    numero: row.numero,
    cliente_id: row.cliente_id,
    cliente_nombre: row.cliente_nombre,
    cliente_ruc: row.cliente_ruc || '',
    vendedor_id: row.vendedor_id,
    vendedor_nombre: row.vendedor_nombre,
    fecha: row.fecha,
    subtotal: Number(row.subtotal || 0),
    impuesto_total: Number(row.impuesto_total || 0),
    total: Number(row.total || 0),
    estado: row.estado,
    metodo_pago: row.metodo_pago || '',
    notas: row.notas || '',
    canal_venta: row.canal_venta || 'venta',
    pago_programado_para: row.pago_programado_para || null,
    pago_autorizado_at: row.pago_autorizado_at || null,
    detalles: (row.detalles || []).map((d: any) => ({
      id: d.id,
      producto_id: d.producto_id,
      producto_nombre: d.producto_nombre,
      producto_codigo: d.producto_codigo,
      cantidad: Number(d.cantidad || 0),
      precio_unitario: Number(d.precio_unitario || 0),
      impuesto: Number(d.impuesto || 0),
      subtotal: Number(d.subtotal || 0),
    })),
    created_at: row.created_at || new Date().toISOString(),
  };
}

function mapProducto(row: any): Producto {
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    descripcion: row.descripcion || '',
    image_url: row.image_url || '',
    precio: Number(row.precio || 0),
    impuesto: Number(row.impuesto || 0),
    stock: Number(row.stock || 0),
    categoria: row.categoria || '',
    activo: Boolean(row.activo),
    created_at: row.created_at || new Date().toISOString(),
  };
}

function mapUsuario(row: any): Usuario {
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    password: row.password || '',
    rol: row.rol,
    profile_image_url: row.profile_image_url || '',
    empresa: row.empresa || '',
    ruc: row.ruc || '',
    telefono: row.telefono || '',
    direccion: row.direccion || '',
    activo: Boolean(row.activo),
    created_at: row.created_at || new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════
// AUTH helper compatible with the old exports
// ═══════════════════════════════════════════════════════════════

/**
 * login
 * Llama a `POST /api/auth/login` con {email,password}.
 * Retorna el `Usuario` (mapeado) si las credenciales son válidas, o `null` en caso contrario.
 */
export async function login(email: string, password: string): Promise<Usuario | null> {
  try {
    const data = await request<{ usuario: Usuario } | { user: Usuario }>(`/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const usuario = (data as any).usuario || (data as any).user || null;
    return usuario ? mapUsuario(usuario) : null;
  } catch {
    return null;
  }
}

/**
 * registrar
 * Llama a `POST /api/auth/registro` con los datos del usuario.
 * Retorna el `Usuario` creado o una cadena con el mensaje de error.
 */
export async function registrar(data: Omit<Usuario, 'id' | 'activo' | 'created_at'>): Promise<Usuario | string> {
  try {
    const resp = await request<{ usuario: Usuario }>(`/api/auth/registro`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapUsuario(resp.usuario);
  } catch (err: any) {
    return err?.message || 'Error en el registro';
  }
}

// ═══════════════════════════════════════════════════════════════
// USUARIOS
// ═══════════════════════════════════════════════════════════════

export async function getUsuarios(): Promise<Usuario[]> {
/**
 * getUsuarios
 * GET /api/usuarios — Devuelve el listado de usuarios (mapeados).
 */
  const rows = await request<any[]>(`/api/usuarios`);
  return rows.map(mapUsuario);
}

export async function getUsuarioById(id: string): Promise<Usuario | undefined> {
/**
 * getUsuarioById
 * GET /api/usuarios/:id — Devuelve un usuario o `undefined` si no existe.
 */
  try {
    return mapUsuario(await request<any>(`/api/usuarios/${id}`));
  } catch {
    return undefined;
  }
}

export async function getUsuariosByRol(rol: string): Promise<Usuario[]> {
/**
 * getUsuariosByRol
 * Filtra localmente los usuarios por `rol` (cliente, vendedor, admin, contador).
 */
  const rows = await getUsuarios();
  return rows.filter(u => u.rol === rol);
}

export async function updateUsuario(id: string, data: Partial<Usuario>): Promise<Usuario | null> {
/**
 * updateUsuario
 * PUT /api/usuarios/:id — Actualiza campos de usuario. Retorna el usuario actualizado o `null`.
 */
  try {
    const row = await request<any>(`/api/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return mapUsuario(row);
  } catch {
    return null;
  }
}

// Variante que devuelve el error para mostrar mensajes detallados en la UI
export async function updateUsuarioWithError(id: string, data: Partial<Usuario>): Promise<{ usuario?: Usuario; error?: string }> {
  try {
    const row = await request<any>(`/api/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return { usuario: mapUsuario(row) };
  } catch (err: any) {
    return { error: err?.message || 'Error actualizando usuario' };
  }
}

export async function deleteUsuario(id: string): Promise<boolean> {
/**
 * deleteUsuario
 * DELETE /api/usuarios/:id — Elimina un usuario. Retorna `true` si se eliminó.
 */
  try {
    await request<{ message: string }>(`/api/usuarios/${id}`, { method: 'DELETE' });
    return true;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// PRODUCTOS
// ═══════════════════════════════════════════════════════════════

export async function getProductos(): Promise<Producto[]> {
/**
 * getProductos
 * GET /api/productos — Lista productos.
 */
  const rows = await request<any[]>(`/api/productos`);
  return rows.map(mapProducto);
}

export async function getProductoById(id: string): Promise<Producto | undefined> {
/**
 * getProductoById
 * GET /api/productos/:id — Detalle de producto o `undefined`.
 */
  try {
    return mapProducto(await request<any>(`/api/productos/${id}`));
  } catch {
    return undefined;
  }
}

export async function createProducto(data: Omit<Producto, 'id' | 'created_at'>): Promise<Producto | null> {
/**
 * createProducto
 * POST /api/productos — Crea un producto y retorna el producto creado o `null`.
 */
  try {
    const row = await request<any>(`/api/productos`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapProducto(row);
  } catch {
    return null;
  }
}

export async function updateProducto(id: string, data: Partial<Producto>): Promise<Producto | null> {
/**
 * updateProducto
 * PUT /api/productos/:id — Actualiza producto. Retorna el producto actualizado o `null`.
 */
  try {
    const row = await request<any>(`/api/productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return mapProducto(row);
  } catch {
    return null;
  }
}

export async function deleteProducto(id: string): Promise<boolean> {
/**
 * deleteProducto
 * DELETE /api/productos/:id — Elimina producto. Retorna `true` si se eliminó.
 */
  try {
    await request<{ message: string }>(`/api/productos/${id}`, { method: 'DELETE' });
    return true;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// FACTURAS
// ═══════════════════════════════════════════════════════════════

export async function getFacturas(filters?: { estado?: string; cliente_id?: string; vendedor_id?: string }): Promise<Factura[]> {
/**
 * getFacturas
 * GET /api/facturas[?filters] — Lista facturas. Opcionalmente filtra por estado, cliente_id o vendedor_id.
 */
  const params = new URLSearchParams();
  if (filters?.estado) params.set('estado', filters.estado);
  if (filters?.cliente_id) params.set('cliente_id', filters.cliente_id);
  if (filters?.vendedor_id) params.set('vendedor_id', filters.vendedor_id);
  const qs = params.toString();
  const rows = await request<any[]>(`/api/facturas${qs ? `?${qs}` : ''}`);
  return rows.map(mapFactura);
}

export async function getMetodosPago(): Promise<string[]> {
/**
 * getMetodosPago
 * GET /api/facturas/metodos-pago — Devuelve los métodos de pago disponibles.
 */
  return request<string[]>(`/api/facturas/metodos-pago`);
}

export async function getFacturaById(id: string): Promise<Factura | undefined> {
/**
 * getFacturaById
 * GET /api/facturas/:id — Devuelve la factura con sus detalles o `undefined`.
 */
  try {
    return mapFactura(await request<any>(`/api/facturas/${id}`));
  } catch {
    return undefined;
  }
}

export async function getFacturasByCliente(clienteId: string): Promise<Factura[]> {
/**
 * getFacturasByCliente
 * Conveniencia: llama a `getFacturas` con `cliente_id`.
 */
  return getFacturas({ cliente_id: clienteId });
}

export async function getFacturasByVendedor(vendedorId: string): Promise<Factura[]> {
/**
 * getFacturasByVendedor
 * Conveniencia: llama a `getFacturas` con `vendedor_id`.
 */
  return getFacturas({ vendedor_id: vendedorId });
}

export async function createFactura(data: {
  cliente_id: string;
  cliente_nombre: string;
  cliente_ruc: string;
  vendedor_id: string;
  vendedor_nombre: string;
  metodo_pago: string;
  notas: string;
  detalles: DetalleFactura[];
  canal_venta?: 'venta' | 'tienda';
}): Promise<Factura | null> {
/**
 * createFactura
 * POST /api/facturas — Crea una factura con sus detalles en una transacción.
 * Recibe objeto con cliente, vendedor, metodo_pago, notas y `detalles`.
 * Retorna la factura creada (mapeada) o `null` en caso de error.
 */
  try {
    const row = await request<any>(`/api/facturas`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapFactura(row);
  } catch {
    return null;
  }
}

export async function updateFactura(id: string, data: Partial<Factura>): Promise<Factura | null> {
/**
 * updateFactura
 * PUT /api/facturas/:id — Actualiza estado o notas de la factura. Retorna la factura actualizada o `null`.
 */
  try {
    const row = await request<any>(`/api/facturas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return mapFactura(row);
  } catch {
    return null;
  }
}

export async function deleteFactura(id: string): Promise<boolean> {
/**
 * deleteFactura
 * DELETE /api/facturas/:id — Elimina una factura. Retorna `true` si se eliminó.
 */
  try {
    await request<{ message: string }>(`/api/facturas/${id}`, { method: 'DELETE' });
    return true;
  } catch {
    return false;
  }
}

export async function extendFacturaTiempo(id: string, minutos: number): Promise<Factura | null> {
  /**
   * extendFacturaTiempo
   * POST /api/facturas/:id/ampliar — Añade `minutos` al pago_programado_para de la factura.
   */
  try {
    const row = await request<any>(`/api/facturas/${id}/ampliar`, {
      method: 'POST',
      body: JSON.stringify({ minutos }),
    });
    return mapFactura(row);
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD / REPORTES
// ═══════════════════════════════════════════════════════════════

export async function getStats() {
  /**
   * getStats
   * GET /api/dashboard/stats — Devuelve métricas resumidas para el dashboard.
   */
  return request<{
    totalUsuarios: number;
    totalClientes: number;
    totalProductos: number;
    totalFacturas: number;
    montoTotal: number;
    impuestoTotal: number;
    emitidas: number;
    pagadas: number;
    anuladas: number;
    pendientes: number;
  }>(`/api/dashboard/stats`);
}

// ═══════════════════════════════════════════════════════════════
// CONFIG AUTOPAGO
// ═══════════════════════════════════════════════════════════════

export async function getAutopagoConfig(): Promise<AutopagoConfig> {
  return request<AutopagoConfig>(`/api/config/autopago`);
}

export async function updateAutopagoConfig(data: { activo: boolean; minutos: number }): Promise<AutopagoConfig | null> {
  try {
    return await request<AutopagoConfig>(`/api/config/autopago`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  } catch {
    return null;
  }
}
