// Pequeñas utilidades para formateo de números y moneda
export function formatCurrency(value, { locale = 'es-AR', currency = 'ARS' } = {}) {
  const num = Number(value);
  if (!isFinite(num)) return '—';
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, currencyDisplay: 'narrowSymbol', minimumFractionDigits: 2 }).format(num);
  } catch {
    // fallback simple
    return '$ ' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
}

export function formatNumber(value, { locale = 'es-AR' } = {}) {
  const num = Number(value);
  if (!isFinite(num)) return '—';
  try {
    return new Intl.NumberFormat(locale).format(num);
  } catch {
    return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
}

export default { formatCurrency, formatNumber };
