import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { AnalyticsService } from '../../services/AnalyticsService';
import { SucursalesService } from '../../services/SucursalesService';
import { Box, Typography, Grid, Paper, Button, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function VentasAnalytics() {
  const [summary, setSummary] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sucursales, setSucursales] = useState([]);
  const [selectedSucursal, setSelectedSucursal] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const analyticsService = React.useMemo(() => new AnalyticsService(), []);
  const sucursalesService = React.useMemo(() => new SucursalesService(), []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedSucursal) params.idSucursal = selectedSucursal;
      const [summaryData, tsData, topData] = await Promise.all([
        analyticsService.summary(params),
        analyticsService.timeseries(params),
        analyticsService.topProducts({ ...params, limit: 10 })
      ]);
      setSummary(summaryData);
      setTimeseries(tsData || []);
      setTopProducts(topData || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error cargando analytics', err);
    } finally { setLoading(false); }
  }, [selectedSucursal]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Cargar lista de sucursales para el selector
  useEffect(() => {
    let mounted = true;
    sucursalesService.list().then(data => { if (mounted) setSucursales(data || []); }).catch(() => {});
    return () => { mounted = false; };
  }, [sucursalesService]);

  // Export CSV helper
  const exportCSV = () => {
    const lines = [];
    const suc = sucursales.find(s => String(s.idSucursal) === String(selectedSucursal));
    const sucLabel = suc ? suc.nombre.replace(/,/g, '') : 'Todas';
    lines.push(`Sucursal: ${sucLabel}`);
    lines.push(`Generado: ${new Date().toLocaleString()}`);
    lines.push('Top products - Producto,Unidades,Ingresos');
    topProducts.forEach(p => lines.push(`${p.nombre},${p.cantidad},${p.ingresos}`));
    lines.push('\nTimeseries - Fecha,Pedidos,Ingresos');
    timeseries.forEach(t => lines.push(`${new Date(t.fecha).toLocaleDateString('es-AR')},${t.pedidos},${t.ingresos}`));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sucName = selectedSucursal ? `sucursal_${selectedSucursal}` : 'todas';
    a.download = `ventas_analytics_${sucName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Preparar datos para el gráfico (recharts)
  const chartData = useMemo(() => {
    return timeseries.map(t => ({
      fecha: new Date(t.fecha).toLocaleDateString('es-AR'),
      ingresos: Number(t.ingresos),
      pedidos: Number(t.pedidos),
    }));
  }, [timeseries]);

  // Layout helpers: fixed heights to avoid visual jumps cuando cambian filtros
  const kpiHeight = 120; // altura fija para tarjetas KPI (adecuada para números grandes)
  const panelHeight = 480; // altura fija para panels principales (Top productos / Series) - aumentada
  const chartHeight = 360; // altura interna para el gráfico dentro del panel - aumentada

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Ventas - Analytics</Typography>
      <Grid container spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
        <Grid item>
          <Typography variant="body2">Sucursal:</Typography>
        </Grid>
        <Grid item>
          <select value={selectedSucursal} onChange={e => setSelectedSucursal(e.target.value)}>
            <option value="">Todas</option>
            {sucursales.map(s => (
              <option key={s.idSucursal} value={s.idSucursal}>{s.nombre}</option>
            ))}
          </select>
        </Grid>
        <Grid item>
          <Button variant="outlined" onClick={fetchAll} disabled={loading}>{loading ? 'Cargando...' : 'Aplicar'}</Button>
        </Grid>
        <Grid item sx={{ ml: 2 }}>
          <Typography variant="caption">{lastUpdated ? `Última actualización: ${new Date(lastUpdated).toLocaleString()}` : ''}</Typography>
        </Grid>
      </Grid>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: kpiHeight, boxSizing: 'border-box' }}>
            <Typography variant="subtitle2">Pedidos entregados (periodo)</Typography>
            <Typography
              variant="h6"
              noWrap
              title={summary ? String(summary.pedidos) : '—'}
              sx={{ mt: 1, maxWidth: '100%', textAlign: 'center', textOverflow: 'ellipsis', overflow: 'hidden' }}
            >
              {summary ? summary.pedidos : '—'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: kpiHeight, boxSizing: 'border-box' }}>
            <Typography variant="subtitle2">Ingresos (periodo)</Typography>
            <Typography
              variant="h6"
              noWrap
              title={summary ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(summary.ingresos) : '—'}
              sx={{ mt: 1, maxWidth: '100%', textAlign: 'center', textOverflow: 'ellipsis', overflow: 'hidden' }}
            >
              {summary ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(summary.ingresos) : '—'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: kpiHeight, boxSizing: 'border-box' }}>
            <Typography variant="subtitle2">AOV (promedio por pedido)</Typography>
            <Typography
              variant="h6"
              noWrap
              title={summary ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(summary.aov) : '—'}
              sx={{ mt: 1, maxWidth: '100%', textAlign: 'center', textOverflow: 'ellipsis', overflow: 'hidden' }}
            >
              {summary ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(summary.aov) : '—'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: panelHeight, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Typography variant="h6">Top productos (por ingresos)</Typography>
            <Box sx={{ width: '100%', overflowX: 'auto', mt: 1, flex: '1 1 auto' }}>
              <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell align="right">Unidades</TableCell>
                  <TableCell align="right">Ingresos</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topProducts.map(p => (
                  <TableRow key={p.idProducto}>
                    <TableCell sx={{ maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nombre}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{p.cantidad}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(p.ingresos)}</TableCell>
                  </TableRow>
                ))}
                {topProducts.length === 0 && (
                  <TableRow><TableCell colSpan={3}>No hay datos</TableCell></TableRow>
                )}
              </TableBody>
              </Table>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: panelHeight, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Typography variant="h6">Series (ingresos por día)</Typography>
            <Box sx={{ maxHeight: panelHeight, overflow: 'hidden', mt: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ width: '100%', height: chartHeight, flex: `0 0 ${chartHeight}px` }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="fecha" 
                      tick={{ fontSize: 11 }} 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      width={120} 
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(v)} 
                    />
                    <Tooltip 
                      formatter={(value) => [new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value), 'Ingresos']}
                      labelFormatter={(label) => `Fecha: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ingresos" 
                      stroke="#1976d2" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#1976d2' }}
                      activeDot={{ r: 6, fill: '#1976d2' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
              <Table size="small" sx={{ mt: 1, flex: '1 1 auto' }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell align="right">Pedidos</TableCell>
                    <TableCell align="right">Ingresos</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {timeseries.map(t => (
                    <TableRow key={t.fecha}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(t.fecha).toLocaleDateString()}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{t.pedidos}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(t.ingresos)}</TableCell>
                    </TableRow>
                  ))}
                  {timeseries.length === 0 && <TableRow><TableCell colSpan={3}>No hay datos</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 2 }}>
        <Button variant="contained" onClick={fetchAll} disabled={loading} sx={{ mr: 2 }}>{loading ? 'Cargando...' : 'Actualizar'}</Button>
        <Button variant="outlined" onClick={exportCSV} disabled={timeseries.length === 0 && topProducts.length === 0}>Exportar CSV</Button>
      </Box>
    </Box>
  );
}
