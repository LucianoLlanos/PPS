import React, { useState, useEffect, useMemo } from 'react';
import { ServiciosService } from '../services/ServiciosService';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Select,
  MenuItem,
  TextField,
  Chip,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  CircularProgress
} from '@mui/material';
import ExpandableText from './ExpandableText';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import '../stylos/admin/ServiciosAdmin.css';
import { STATUSES, getStatusInfo } from '../utils/statusColors';
import StatusPill from './StatusPill';

function ServiciosAdmin() {
  const serviciosService = useMemo(() => new ServiciosService(), []);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [editandoServicio, setEditandoServicio] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filtroFechaRapido, setFiltroFechaRapido] = useState('');

  // Los estados y colores vienen de ../utils/statusColors (STATUSES)

  const tiposServicio = {
    instalacion: 'Instalación de producto',
    mantenimiento: 'Mantenimiento',
    garantia: 'Arreglo por garantía'
  };

  useEffect(() => {
    cargarServicios();
  }, []);

  const cargarServicios = async () => {
    setLoading(true);
    try {
      const data = await serviciosService.listAdmin();
      setServicios(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError('Error al cargar los servicios');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtrarServicios = () => {
    let serviciosFiltrados = [...servicios];
    if (filtroEstado !== 'todos') serviciosFiltrados = serviciosFiltrados.filter(s => s.estado === filtroEstado);
    if (fechaDesde) {
      // Interpretar fechaDesde como inicio del día en zona local
      const desde = new Date(fechaDesde + 'T00:00:00');
      serviciosFiltrados = serviciosFiltrados.filter(s => new Date(s.fechaCreacion) >= desde);
    }
    if (fechaHasta) {
      // Interpretar fechaHasta como fin del día en zona local
      const hasta = new Date(fechaHasta + 'T23:59:59.999');
      serviciosFiltrados = serviciosFiltrados.filter(s => new Date(s.fechaCreacion) <= hasta);
    }
    return serviciosFiltrados;
  };

  const aplicarFiltroFechaRapido = (filtro) => {
    const hoy = new Date();
    // Formatea fecha en formato local 'YYYY-MM-DD'
    const formatLocalDate = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    let desde = '';
    let hasta = '';
    switch (filtro) {
      case 'hoy':
        desde = hasta = formatLocalDate(hoy);
        break;
      case 'semana': {
        const inicioSemana = new Date(hoy);
        // inicio de semana (domingo)
        inicioSemana.setDate(hoy.getDate() - hoy.getDay());
        desde = formatLocalDate(inicioSemana);
        hasta = formatLocalDate(hoy);
        break;
      }
      case 'mes': {
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        desde = formatLocalDate(inicioMes);
        hasta = formatLocalDate(hoy);
        break;
      }
      case 'ultimo-mes': {
        const hace30 = new Date(hoy);
        hace30.setDate(hoy.getDate() - 30);
        desde = formatLocalDate(hace30);
        hasta = formatLocalDate(hoy);
        break;
      }
      case 'limpiar':
        desde = hasta = '';
        setFiltroFechaRapido('');
        break;
      default:
        break;
    }

    setFechaDesde(desde);
    setFechaHasta(hasta);
    if (filtro !== 'limpiar') setFiltroFechaRapido(filtro);
  };

  // Use helper centralizado
  // getStatusInfo está importado desde ../utils/statusColors

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    return new Date(fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatearFechaCorta = (fecha) => fecha ? new Date(fecha).toLocaleDateString('es-ES') : 'No especificada';

  const handleCambiarEstado = async () => {
    if (!editandoServicio || !nuevoEstado) return;
    try {
      await serviciosService.updateAdmin(editandoServicio.idSolicitud, { estado: nuevoEstado, observacionesAdmin: observaciones });
      setSuccess('Estado actualizado correctamente');
      setEditandoServicio(null); setNuevoEstado(''); setObservaciones('');
      cargarServicios();
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('servicios:updated', { detail: { id: editandoServicio.idSolicitud, estado: nuevoEstado } }));
      }
    } catch (err) {
      setError('Error al actualizar el estado'); console.error(err);
    }
  };

  const abrirModalEdicion = (servicio) => { setEditandoServicio(servicio); setNuevoEstado(servicio.estado); setObservaciones(servicio.observacionesAdmin || ''); };
  const cerrarModal = () => { setEditandoServicio(null); setNuevoEstado(''); setObservaciones(''); };

  const serviciosFiltrados = filtrarServicios();

  return (
    <Container maxWidth="lg" className="servicios-admin-container">
      <div className="servicios-admin-header">
        <div>
          <Typography variant="h3" component="h1" className="servicios-title">Gestión de Servicios Post-Venta</Typography>
          <Typography className="servicios-subtitle">Administra y modifica el estado de las solicitudes</Typography>
        </div>
        <div>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={cargarServicios} disabled={loading}>{loading ? <CircularProgress size={18} /> : 'Actualizar'}</Button>
        </div>
      </div>

      {(error || success) && (
        <div className="servicios-alerts">
          {error && <Paper className="servicio-alert servicio-alert-error">{error}</Paper>}
          {success && <Paper className="servicio-alert servicio-alert-success">{success}</Paper>}
        </div>
      )}

      <Paper className="servicios-filters-paper" elevation={1}>
        <Grid container spacing={3} alignItems="flex-start">
          <Grid item xs={12} md={4} className="servicios-filter-estado">
            <Typography variant="subtitle2" className="servicios-subtitle2">Filtrar por estado</Typography>
            <div className="servicios-filter-estado">
              <Select fullWidth value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <MenuItem value="todos">Todos los estados</MenuItem>
                {STATUSES.map(e => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
              </Select>
            </div>
          </Grid>

          <Grid item xs={12} md={8} className="servicios-filter-fecha">
            <Typography variant="subtitle2" className="servicios-subtitle2">Filtros por fecha</Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={7}>
                <div className="servicios-filter-fecha">
                  <Button size="small" variant={filtroFechaRapido === 'hoy' ? 'contained' : 'outlined'} onClick={() => aplicarFiltroFechaRapido('hoy')}>Hoy</Button>
                  <Button size="small" variant={filtroFechaRapido === 'semana' ? 'contained' : 'outlined'} onClick={() => aplicarFiltroFechaRapido('semana')}>Esta semana</Button>
                  <Button size="small" variant={filtroFechaRapido === 'mes' ? 'contained' : 'outlined'} onClick={() => aplicarFiltroFechaRapido('mes')}>Este mes</Button>
                  <Button size="small" variant={filtroFechaRapido === 'ultimo-mes' ? 'contained' : 'outlined'} onClick={() => aplicarFiltroFechaRapido('ultimo-mes')}>Últimos 30 días</Button>
                  <Button size="small" variant="outlined" color="inherit" onClick={() => aplicarFiltroFechaRapido('limpiar')}>Limpiar</Button>
                </div>
              </Grid>
              <Grid item xs={12} md={5} className="servicios-filter-dates">
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Desde</Typography>
                    <TextField fullWidth size="small" type="date" value={fechaDesde} onChange={(e) => { setFechaDesde(e.target.value); setFiltroFechaRapido(''); }} />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Hasta</Typography>
                    <TextField fullWidth size="small" type="date" value={fechaHasta} onChange={(e) => { setFechaHasta(e.target.value); setFiltroFechaRapido(''); }} />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Estadísticas */}
        <Divider className="divider-wide" />
        <div className="servicios-stats">
          {STATUSES.map(st => {
            const count = filtrarServicios().filter(s => s.estado === st.value).length;
            return <Chip key={st.value} label={`${st.label}: ${count}`} className={`estado-chip chip-${st.value}`} />;
          })}
          <Chip label={`Total: ${filtrarServicios().length}`} color="default" className="chip-total" />
        </div>
      </Paper>

      {/* Lista de tarjetas */}
      {serviciosFiltrados.length === 0 ? (
        <Paper className="servicios-no-results">
          <Typography variant="h6" color="text.secondary">No hay servicios</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2} alignItems="stretch">
          {serviciosFiltrados.map(servicio => {
            const estadoInfo = getStatusInfo(servicio.estado);
            return (
              <Grid item xs={12} md={6} key={servicio.idSolicitud} className="services-grid-item">
                <Card className="servicio-card">
                    <CardHeader
                    title={`Solicitud #${servicio.idSolicitud}`}
                    subheader={`Creado: ${formatearFecha(servicio.fechaCreacion)}`}
                    action={<StatusPill value={servicio.estado} label={estadoInfo.label} />}
                  />
                  <CardContent className="servicio-card-content">
                    <Grid container spacing={1}>
                      <Grid item xs={12} sm={6} className="right-column">
                        <Typography variant="subtitle2">Cliente</Typography>
                        <Typography><strong>{servicio.nombre} {servicio.apellido}</strong></Typography>
                        <Typography variant="body2" color="text.secondary">{servicio.email}</Typography>
                        {servicio.telefono && <Typography variant="body2" color="text.secondary">{servicio.telefono}</Typography>}
                        <Divider className="divider-compact" />
                        <Typography variant="subtitle2">Dirección</Typography>
                        <Typography variant="body2">{servicio.direccion}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2">Tipo de Servicio</Typography>
                        <Box sx={{ display: 'inline-block' }}>
                          <StatusPill value="tipo" label={tiposServicio[servicio.tipoServicio] || servicio.tipoServicio} />
                        </Box>
                        <Typography variant="subtitle2">Descripción</Typography>
                        <ExpandableText text={servicio.descripcion || ''} lines={3} className="servicios-history-description" />
                        {(servicio.fechaPreferida || servicio.horaPreferida) && (
                          <>
                            <Divider className="divider-compact" />
                            <Typography variant="subtitle2">Fecha Preferida</Typography>
                            <Typography variant="body2">{formatearFechaCorta(servicio.fechaPreferida)}{servicio.horaPreferida ? ` a las ${servicio.horaPreferida}` : ''}</Typography>
                          </>
                        )}
                        {servicio.observacionesAdmin && (
                          <>
                            <Divider className="divider-compact" />
                            <Typography variant="subtitle2">Observaciones Admin</Typography>
                            <Typography variant="body2" color="text.secondary">{servicio.observacionesAdmin}</Typography>
                          </>
                        )}
                      </Grid>
                    </Grid>
                  </CardContent>
                  <CardActions>
                    <Button size="small" startIcon={<EditIcon />} onClick={() => abrirModalEdicion(servicio)}>Cambiar Estado</Button>
                    {servicio.fechaActualizacion && <Typography variant="caption" color="text.secondary" className="servicio-updated">Última actualización: {formatearFecha(servicio.fechaActualizacion)}</Typography>}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Dialog de edición */}
      <Dialog open={!!editandoServicio} onClose={cerrarModal} fullWidth maxWidth="sm" disableScrollLock>
        <DialogTitle>Cambiar Estado - {editandoServicio ? `Solicitud #${editandoServicio.idSolicitud}` : ''}</DialogTitle>
        <DialogContent dividers>
          {editandoServicio && (
            <div className="dialog-grid">
              <div>
                <Typography variant="caption" color="text.secondary">Cliente</Typography>
                <Typography><strong>{editandoServicio.nombre} {editandoServicio.apellido}</strong></Typography>
              </div>
              <div>
                <Typography variant="caption" color="text.secondary">Tipo de servicio</Typography>
                <Typography>{tiposServicio[editandoServicio.tipoServicio] || editandoServicio.tipoServicio}</Typography>
              </div>
              <div>
                <Typography variant="caption" color="text.secondary">Estado actual</Typography>
                <Chip label={getStatusInfo(editandoServicio.estado).label} className={`estado-chip chip-${editandoServicio.estado}`} />
              </div>
              <div>
                <Typography variant="caption" color="text.secondary">Nuevo estado</Typography>
                <Select fullWidth value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)} MenuProps={{ disableScrollLock: true }}>
                  {STATUSES.map(st => <MenuItem key={st.value} value={st.value}>{st.label}</MenuItem>)}
                </Select>
              </div>
              <div>
                <Typography variant="caption" color="text.secondary">Observaciones (opcional)</Typography>
                <TextField fullWidth multiline rows={3} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarModal}>Cancelar</Button>
          <Button onClick={handleCambiarEstado} variant="contained" disabled={!nuevoEstado}>Actualizar Estado</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default ServiciosAdmin;