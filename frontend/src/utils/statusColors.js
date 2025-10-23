// Mapeo centralizado de estados -> label y colores
export const STATUS_MAP = {
  pendiente: { label: 'Pendiente', color: '#8a5800', bg: '#fff4e5' },
  confirmado: { label: 'Confirmado', color: '#0066cc', bg: '#e8f7ff' },
  en_proceso: { label: 'En Proceso', color: '#b35a00', bg: '#fff6e6' },
  completado: { label: 'Completado', color: '#0b8457', bg: '#e9f9ec' },
  cancelado: { label: 'Cancelado', color: '#bb2d3b', bg: '#fdecea' }
};

// estados comunes en Pedidos (forma alternativa)
STATUS_MAP.enviado = { label: 'Enviado', color: '#0b66c2', bg: '#eaf4ff' };
STATUS_MAP.entregado = { label: 'Entregado', color: '#0b8457', bg: '#e9f9ec' };

// Array utilizable en selects / iteraciones (preserva orden)
export const STATUSES = Object.keys(STATUS_MAP).map(key => ({ value: key, label: STATUS_MAP[key].label, color: STATUS_MAP[key].color, bg: STATUS_MAP[key].bg }));

export function getStatusInfo(estado) {
  if (!estado) return { label: '', color: '#444', bg: '#f1f1f1' };
  const key = String(estado).toLowerCase().replace(/\s+/g, '_');
  const info = STATUS_MAP[key] || STATUS_MAP[estado];
  if (!info) return { label: typeof estado === 'string' ? (estado.charAt(0).toUpperCase() + estado.slice(1)) : String(estado), color: '#444', bg: '#f1f1f1' };
  return info;
}

export default { STATUS_MAP, STATUSES, getStatusInfo };
