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
    const sep = ';';
    const suc = sucursales.find(s => String(s.idSucursal) === String(selectedSucursal));
    const sucLabel = suc ? suc.nombre : 'Todas';

    const escape = (v) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };

    const rows = [];
    // Metadata
    rows.push([`Sucursal`, sucLabel]);
    rows.push([`Generado`, new Date().toLocaleString()]);
    rows.push([]);

    // Top products section
    rows.push([`Top productos (por ingresos)`]);
    rows.push([`Producto`, `Unidades`, `Ingresos (ARS)`]);
    let totalUnidades = 0;
    let totalIngresos = 0;
    topProducts.forEach(p => {
      const unidades = Number(p.cantidad || 0);
      const ingresos = Number(p.ingresos || 0);
      totalUnidades += unidades;
      totalIngresos += ingresos;
      rows.push([p.nombre, unidades, new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(ingresos)]);
    });
    // Totals for top products
    if (topProducts.length > 0) {
      rows.push([]);
      rows.push([`Total`, totalUnidades, new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(totalIngresos)]);
    }

    rows.push([]);

    // Timeseries section
    rows.push([`Series (ingresos por día)`]);
    rows.push([`Fecha`, `Pedidos`, `Ingresos (ARS)`]);
    let totalPedidos = 0;
    let totalTsIngresos = 0;
    timeseries.forEach(t => {
      const pedidos = Number(t.pedidos || 0);
      const ingresos = Number(t.ingresos || 0);
      totalPedidos += pedidos;
      totalTsIngresos += ingresos;
      rows.push([new Date(t.fecha).toLocaleDateString('es-AR'), pedidos, new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(ingresos)]);
    });
    if (timeseries.length > 0) {
      rows.push([]);
      rows.push([`Total periodo`, totalPedidos, new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(totalTsIngresos)]);
    }

    // Build CSV text with BOM so Excel detects UTF-8
    const csvLines = rows.map(r => r.map(c => escape(c)).join(sep));
    const csvContent = '\uFEFF' + csvLines.join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateSuffix = new Date().toISOString().slice(0,10);
    const sucName = selectedSucursal ? `sucursal_${selectedSucursal}` : 'todas';
    a.download = `ventas_analytics_${sucName}_${dateSuffix}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Excel (XLSX) helper - carga SheetJS dinámicamente desde CDN
  const exportExcel = async () => {
    try {
      if (!window.XLSX) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js';
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      const XLSX = window.XLSX;

      // Top products sheet
      const topSheetData = [];
      topSheetData.push([`Top productos (por ingresos)`]);
      topSheetData.push([`Producto`, `Unidades`, `Ingresos (ARS)`, `Ingresos (raw)`]);
      let totalUn = 0;
      let totalIng = 0;
      topProducts.forEach(p => {
        const unidades = Number(p.cantidad || 0);
        const ingresos = Number(p.ingresos || 0);
        totalUn += unidades;
        totalIng += ingresos;
        topSheetData.push([p.nombre, unidades, new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(ingresos), ingresos]);
      });
      if (topProducts.length > 0) topSheetData.push([`Total`, totalUn, new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(totalIng), totalIng]);

      // Timeseries sheet
      const tsSheetData = [];
      tsSheetData.push([`Series (ingresos por día)`]);
      tsSheetData.push([`Fecha`, `Pedidos`, `Ingresos (ARS)`, `Ingresos (raw)`]);
      let totalPedidos = 0;
      let totalTsIngresos = 0;
      timeseries.forEach(t => {
        const pedidos = Number(t.pedidos || 0);
        const ingresos = Number(t.ingresos || 0);
        totalPedidos += pedidos;
        totalTsIngresos += ingresos;
        tsSheetData.push([new Date(t.fecha).toLocaleDateString('es-AR'), pedidos, new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(ingresos), ingresos]);
      });
      if (timeseries.length > 0) tsSheetData.push([`Total periodo`, totalPedidos, new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(totalTsIngresos), totalTsIngresos]);

      const wb = XLSX.utils.book_new();
      const wsTop = XLSX.utils.aoa_to_sheet(topSheetData);
      const wsTs = XLSX.utils.aoa_to_sheet(tsSheetData);

      // Set column widths for readability
      wsTop['!cols'] = [{ wch: 40 }, { wch: 12 }, { wch: 18 }, { wch: 12 }];
      wsTs['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 18 }, { wch: 12 }];

      XLSX.utils.book_append_sheet(wb, wsTop, 'Top productos');
      XLSX.utils.book_append_sheet(wb, wsTs, 'Series');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateSuffix = new Date().toISOString().slice(0,10);
      const sucName = selectedSucursal ? `sucursal_${selectedSucursal}` : 'todas';
      a.download = `ventas_analytics_${sucName}_${dateSuffix}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exportando Excel, cayendo al CSV', err);
      exportCSV();
    }
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
            <Box sx={{ width: '100%', overflowX: 'hidden', mt: 1, flex: '1 1 auto' }}>
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
                    <TableCell sx={{ maxWidth: 220, whiteSpace: 'normal', overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word' }}>{p.nombre}</TableCell>
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
        <Button variant="outlined" onClick={exportCSV} disabled={timeseries.length === 0 && topProducts.length === 0} sx={{ mr: 1 }}>Exportar CSV</Button>
        <Button variant="outlined" onClick={exportExcel} disabled={timeseries.length === 0 && topProducts.length === 0}>Exportar Excel</Button>
      </Box>
    </Box>
  );
}
