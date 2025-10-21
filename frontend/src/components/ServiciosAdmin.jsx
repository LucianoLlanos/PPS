import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import '../stylos/admin/Admin.css';

function ServiciosAdmin() {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [editandoServicio, setEditandoServicio] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  
  // Estados para filtros de fecha
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filtroFechaRapido, setFiltroFechaRapido] = useState('');

  // Estados disponibles
  const estados = [
    { value: 'pendiente', label: 'Pendiente', color: '#ffc107', bgColor: '#fff3cd' },
    { value: 'confirmado', label: 'Confirmado', color: '#17a2b8', bgColor: '#d1ecf1' },
    { value: 'en_proceso', label: 'En Proceso', color: '#fd7e14', bgColor: '#fdf2e9' },
    { value: 'completado', label: 'Completado', color: '#28a745', bgColor: '#d4edda' },
    { value: 'cancelado', label: 'Cancelado', color: '#dc3545', bgColor: '#f8d7da' }
  ];

  // Tipos de servicios
  const tiposServicio = {
    'instalacion': 'Instalación de producto',
    'mantenimiento': 'Mantenimiento',
    'garantia': 'Arreglo por garantía'
  };

  useEffect(() => {
    cargarServicios();
  }, []);

  const cargarServicios = async () => {
    setLoading(true);
    try {
      const response = await api.get('/servicios/admin/todas');
      setServicios(response.data);
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

    // Filtrar por estado
    if (filtroEstado !== 'todos') {
      serviciosFiltrados = serviciosFiltrados.filter(servicio => servicio.estado === filtroEstado);
    }

    // Filtrar por fechas
    if (fechaDesde) {
      const fechaDesdeObj = new Date(fechaDesde);
      serviciosFiltrados = serviciosFiltrados.filter(servicio => {
        const fechaCreacion = new Date(servicio.fechaCreacion);
        return fechaCreacion >= fechaDesdeObj;
      });
    }

    if (fechaHasta) {
      const fechaHastaObj = new Date(fechaHasta);
      fechaHastaObj.setHours(23, 59, 59, 999); // Incluir todo el día
      serviciosFiltrados = serviciosFiltrados.filter(servicio => {
        const fechaCreacion = new Date(servicio.fechaCreacion);
        return fechaCreacion <= fechaHastaObj;
      });
    }

    return serviciosFiltrados;
  };

  // Función para establecer filtros rápidos de fecha
  const aplicarFiltroFechaRapido = (filtro) => {
    const hoy = new Date();
    let desde = '';
    let hasta = '';

    switch (filtro) {
      case 'hoy':
        desde = hoy.toISOString().split('T')[0];
        hasta = hoy.toISOString().split('T')[0];
        break;
      case 'semana':
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay());
        desde = inicioSemana.toISOString().split('T')[0];
        hasta = hoy.toISOString().split('T')[0];
        break;
      case 'mes':
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        desde = inicioMes.toISOString().split('T')[0];
        hasta = hoy.toISOString().split('T')[0];
        break;
      case 'ultimo-mes':
        const hace30dias = new Date(hoy);
        hace30dias.setDate(hoy.getDate() - 30);
        desde = hace30dias.toISOString().split('T')[0];
        hasta = hoy.toISOString().split('T')[0];
        break;
      case 'limpiar':
        desde = '';
        hasta = '';
        setFiltroFechaRapido('');
        break;
    }

    setFechaDesde(desde);
    setFechaHasta(hasta);
    if (filtro !== 'limpiar') {
      setFiltroFechaRapido(filtro);
    }
  };

  const getEstadoInfo = (estado) => {
    return estados.find(e => e.value === estado) || { label: estado, color: '#6c757d', bgColor: '#f8f9fa' };
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearFechaCorta = (fecha) => {
    if (!fecha) return 'No especificada';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  const handleCambiarEstado = async () => {
    if (!editandoServicio || !nuevoEstado) return;

    try {
      await api.put(`/servicios/admin/solicitud/${editandoServicio.idSolicitud}`, {
        estado: nuevoEstado,
        observacionesAdmin: observaciones
      });

      setSuccess('Estado actualizado correctamente');
      setEditandoServicio(null);
      setNuevoEstado('');
      setObservaciones('');
      cargarServicios();
    } catch (err) {
      setError('Error al actualizar el estado');
      console.error('Error:', err);
    }
  };

  const abrirModalEdicion = (servicio) => {
    setEditandoServicio(servicio);
    setNuevoEstado(servicio.estado);
    setObservaciones(servicio.observacionesAdmin || '');
  };

  const cerrarModal = () => {
    setEditandoServicio(null);
    setNuevoEstado('');
    setObservaciones('');
  };

  const serviciosFiltrados = filtrarServicios();

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading-spinner">Cargando servicios...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>
          <i className="bi bi-tools me-2"></i>
          Gestión de Servicios Post-Venta
        </h1>
        <button 
          onClick={cargarServicios} 
          className="btn btn-outline-primary"
          disabled={loading}
        >
          <i className="bi bi-arrow-clockwise me-1"></i>
          Actualizar
        </button>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="alert alert-danger alert-dismissible">
          {error}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible">
          {success}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setSuccess(null)}
          ></button>
        </div>
      )}

      {/* Filtros */}
      <div className="filters-section mb-4">
        <div className="row">
          <div className="col-md-3">
            <label className="form-label">Filtrar por estado:</label>
            <select 
              className="form-select"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              {estados.map(estado => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="col-md-9">
            <label className="form-label">Filtros por fecha:</label>
            <div className="row g-2">
              {/* Filtros rápidos */}
              <div className="col-md-6">
                <div className="d-flex gap-2 flex-wrap">
                  <button 
                    className={`btn btn-sm ${filtroFechaRapido === 'hoy' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => aplicarFiltroFechaRapido('hoy')}
                  >
                    Hoy
                  </button>
                  <button 
                    className={`btn btn-sm ${filtroFechaRapido === 'semana' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => aplicarFiltroFechaRapido('semana')}
                  >
                    Esta semana
                  </button>
                  <button 
                    className={`btn btn-sm ${filtroFechaRapido === 'mes' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => aplicarFiltroFechaRapido('mes')}
                  >
                    Este mes
                  </button>
                  <button 
                    className={`btn btn-sm ${filtroFechaRapido === 'ultimo-mes' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => aplicarFiltroFechaRapido('ultimo-mes')}
                  >
                    Últimos 30 días
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => aplicarFiltroFechaRapido('limpiar')}
                  >
                    <i className="bi bi-x-circle me-1"></i>
                    Limpiar
                  </button>
                </div>
              </div>
              
              {/* Filtros personalizados */}
              <div className="col-md-6">
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label text-muted" style={{ fontSize: '0.85rem' }}>Desde:</label>
                    <input 
                      type="date"
                      className="form-control form-control-sm"
                      value={fechaDesde}
                      onChange={(e) => {
                        setFechaDesde(e.target.value);
                        setFiltroFechaRapido(''); // Limpiar filtro rápido si se usa personalizado
                      }}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-muted" style={{ fontSize: '0.85rem' }}>Hasta:</label>
                    <input 
                      type="date"
                      className="form-control form-control-sm"
                      value={fechaHasta}
                      onChange={(e) => {
                        setFechaHasta(e.target.value);
                        setFiltroFechaRapido(''); // Limpiar filtro rápido si se usa personalizado
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Estadísticas */}
        <div className="row mt-3">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <label className="form-label mb-2">Estadísticas {(fechaDesde || fechaHasta) && '(filtradas)'}:</label>
                <div className="d-flex gap-3 align-items-center flex-wrap">
                  {estados.map(estado => {
                    const count = filtrarServicios().filter(s => s.estado === estado.value).length;
                    return (
                      <span key={estado.value} className="badge" style={{ 
                        backgroundColor: estado.bgColor, 
                        color: estado.color,
                        fontSize: '0.9rem',
                        padding: '8px 12px'
                      }}>
                        {estado.label}: {count}
                      </span>
                    );
                  })}
                  <span className="badge bg-dark">
                    Total: {filtrarServicios().length}
                  </span>
                </div>
              </div>
              
              {/* Información de filtros activos */}
              {(fechaDesde || fechaHasta || filtroEstado !== 'todos') && (
                <div className="text-muted">
                  <small>
                    <i className="bi bi-funnel me-1"></i>
                    Filtros activos
                    {fechaDesde && (
                      <span className="ms-2">
                        <i className="bi bi-calendar-date me-1"></i>
                        Desde: {new Date(fechaDesde).toLocaleDateString('es-ES')}
                      </span>
                    )}
                    {fechaHasta && (
                      <span className="ms-2">
                        <i className="bi bi-calendar-date me-1"></i>
                        Hasta: {new Date(fechaHasta).toLocaleDateString('es-ES')}
                      </span>
                    )}
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de servicios */}
      <div className="services-grid">
        {serviciosFiltrados.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-inbox display-1 text-muted"></i>
            <p className="text-muted mt-3">
              {filtroEstado === 'todos' 
                ? 'No hay servicios registrados' 
                : `No hay servicios con estado "${getEstadoInfo(filtroEstado).label}"`
              }
            </p>
          </div>
        ) : (
          serviciosFiltrados.map(servicio => {
            const estadoInfo = getEstadoInfo(servicio.estado);
            return (
              <div key={servicio.idSolicitud} className="service-card card mb-3">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-0">
                      <i className="bi bi-hash me-1"></i>
                      Solicitud #{servicio.idSolicitud}
                    </h6>
                    <small className="text-muted">
                      Creado: {formatearFecha(servicio.fechaCreacion)}
                    </small>
                  </div>
                  <span 
                    className="badge" 
                    style={{ 
                      backgroundColor: estadoInfo.bgColor, 
                      color: estadoInfo.color,
                      fontSize: '0.9rem',
                      padding: '8px 12px'
                    }}
                  >
                    {estadoInfo.label}
                  </span>
                </div>

                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <h6><i className="bi bi-person me-1"></i>Cliente</h6>
                      <p className="mb-1">
                        <strong>{servicio.nombre} {servicio.apellido}</strong>
                      </p>
                      <p className="mb-1 text-muted">
                        <i className="bi bi-envelope me-1"></i>
                        {servicio.email}
                      </p>
                      {servicio.telefono && (
                        <p className="mb-3 text-muted">
                          <i className="bi bi-telephone me-1"></i>
                          {servicio.telefono}
                        </p>
                      )}

                      <h6><i className="bi bi-geo-alt me-1"></i>Dirección</h6>
                      <p className="mb-3">{servicio.direccion}</p>
                    </div>

                    <div className="col-md-6">
                      <h6><i className="bi bi-tools me-1"></i>Tipo de Servicio</h6>
                      <p className="mb-3">
                        <span className="badge bg-info">
                          {tiposServicio[servicio.tipoServicio] || servicio.tipoServicio}
                        </span>
                      </p>

                      <h6><i className="bi bi-chat-text me-1"></i>Descripción</h6>
                      <p className="mb-3">{servicio.descripcion}</p>

                      {(servicio.fechaPreferida || servicio.horaPreferida) && (
                        <>
                          <h6><i className="bi bi-calendar me-1"></i>Fecha Preferida</h6>
                          <p className="mb-3">
                            {formatearFechaCorta(servicio.fechaPreferida)}
                            {servicio.horaPreferida && ` a las ${servicio.horaPreferida}`}
                          </p>
                        </>
                      )}

                      {servicio.observacionesAdmin && (
                        <>
                          <h6><i className="bi bi-clipboard me-1"></i>Observaciones Admin</h6>
                          <p className="mb-3 text-muted">{servicio.observacionesAdmin}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="card-footer">
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => abrirModalEdicion(servicio)}
                  >
                    <i className="bi bi-pencil me-1"></i>
                    Cambiar Estado
                  </button>
                  {servicio.fechaActualizacion && (
                    <small className="text-muted ms-3">
                      Última actualización: {formatearFecha(servicio.fechaActualizacion)}
                    </small>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal para cambiar estado */}
      {editandoServicio && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Cambiar Estado - Solicitud #{editandoServicio.idSolicitud}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={cerrarModal}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Cliente:</label>
                  <p><strong>{editandoServicio.nombre} {editandoServicio.apellido}</strong></p>
                </div>

                <div className="mb-3">
                  <label className="form-label">Tipo de servicio:</label>
                  <p>{tiposServicio[editandoServicio.tipoServicio]}</p>
                </div>

                <div className="mb-3">
                  <label className="form-label">Estado actual:</label>
                  <span 
                    className="badge ms-2" 
                    style={{ 
                      backgroundColor: getEstadoInfo(editandoServicio.estado).bgColor, 
                      color: getEstadoInfo(editandoServicio.estado).color 
                    }}
                  >
                    {getEstadoInfo(editandoServicio.estado).label}
                  </span>
                </div>

                <div className="mb-3">
                  <label className="form-label">Nuevo estado:</label>
                  <select 
                    className="form-select"
                    value={nuevoEstado}
                    onChange={(e) => setNuevoEstado(e.target.value)}
                  >
                    {estados.map(estado => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Observaciones (opcional):</label>
                  <textarea 
                    className="form-control"
                    rows="3"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Agregar observaciones sobre el estado del servicio..."
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={cerrarModal}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleCambiarEstado}
                  disabled={!nuevoEstado}
                >
                  Actualizar Estado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {editandoServicio && <div className="modal-backdrop fade show"></div>}
    </div>
  );
}

export default ServiciosAdmin;