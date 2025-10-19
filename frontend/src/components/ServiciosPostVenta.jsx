import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import '../stylos/ServiciosPostVenta.css';

export default function ServiciosPostVenta() {
  const [formData, setFormData] = useState({
    tipoServicio: '',
    descripcion: '',
    direccion: '',
    telefono: '',
    fechaPreferida: '',
    horaPreferida: ''
  });
  const [tiposServicio, setTiposServicio] = useState([]);
  const [misSolicitudes, setMisSolicitudes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activeTab, setActiveTab] = useState('solicitar');

  // Función para obtener fecha mínima (24 horas después de ahora)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Función para validar fecha y hora
  const validateDateTime = (fecha, hora) => {
    if (!fecha || !hora) return true; // Si no hay fecha u hora, no validar aún
    
    const selectedDateTime = new Date(`${fecha}T${hora}`);
    const minDateTime = new Date();
    minDateTime.setHours(minDateTime.getHours() + 24);
    
    return selectedDateTime >= minDateTime;
  };
  
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    cargarTiposServicio();
    cargarMisSolicitudes();
  }, [user, navigate]);

  const cargarTiposServicio = async () => {
    try {
      const response = await api.get('/servicios/tipos');
      setTiposServicio(response.data);
    } catch (error) {
      setAlerta({ tipo: 'danger', mensaje: 'Error al cargar tipos de servicio' });
    }
  };

  const cargarMisSolicitudes = async () => {
    try {
      const response = await api.get('/servicios/mis-solicitudes');
      setMisSolicitudes(response.data);
    } catch (error) {
      setAlerta({ tipo: 'danger', mensaje: 'Error al cargar solicitudes' });
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const showToastNotification = (message, type = 'success') => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar fecha y hora de 24 horas de anticipación
    if (formData.fechaPreferida && formData.horaPreferida) {
      if (!validateDateTime(formData.fechaPreferida, formData.horaPreferida)) {
        showToastNotification('⚠️ La fecha y hora debe ser con mínimo 24 horas de anticipación', 'error');
        return;
      }
    }

    setLoading(true);

    try {
      const response = await api.post('/servicios/solicitar', formData);
      
      showToastNotification('✅ Solicitud de servicio enviada exitosamente');
      
      // Limpiar formulario
      setFormData({
        tipoServicio: '',
        descripcion: '',
        direccion: '',
        telefono: '',
        fechaPreferida: '',
        horaPreferida: ''
      });

      // Recargar solicitudes y cambiar a la pestaña de historial
      await cargarMisSolicitudes();
      setActiveTab('historial');
      
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al enviar la solicitud';
      showToastNotification('❌ ' + errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      'pendiente': 'badge bg-warning text-dark',
      'confirmado': 'badge bg-info text-white',
      'en_proceso': 'badge bg-primary',
      'completado': 'badge bg-success',
      'cancelado': 'badge bg-danger'
    };
    
    const labels = {
      'pendiente': 'Pendiente',
      'confirmado': 'Confirmado',
      'en_proceso': 'En Proceso',
      'completado': 'Completado',
      'cancelado': 'Cancelado'
    };

    return <span className={badges[estado] || 'badge bg-secondary'}>{labels[estado] || estado}</span>;
  };

  if (!user) {
    return <div className="container mt-4">Debes iniciar sesión para acceder a los servicios.</div>;
  }

  return (
    <div className="servicios-container container">
      <div className="row">
        <div className="col-12">
          <h2 className="servicios-title mb-4">
            <i className="bi bi-tools me-2"></i>
            Servicios Post-Venta
          </h2>
          
          {/* Tabs */}
          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'solicitar' ? 'active' : ''}`}
                onClick={() => setActiveTab('solicitar')}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Solicitar Servicio
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'historial' ? 'active' : ''}`}
                onClick={() => setActiveTab('historial')}
              >
                <i className="bi bi-clock-history me-2"></i>
                Mis Solicitudes ({misSolicitudes.length})
              </button>
            </li>
          </ul>

          {/* Contenido de las tabs */}
          {activeTab === 'solicitar' && (
            <div className="row">
              <div className="col-lg-8">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title mb-4">Nueva Solicitud de Servicio</h5>
                    
                    <form onSubmit={handleSubmit}>
                      {/* Tipo de Servicio */}
                      <div className="mb-3">
                        <label htmlFor="tipoServicio" className="form-label">
                          <i className="bi bi-gear me-2"></i>
                          Tipo de Servicio *
                        </label>
                        <select
                          id="tipoServicio"
                          name="tipoServicio"
                          value={formData.tipoServicio}
                          onChange={handleChange}
                          className="form-select"
                          required
                        >
                          <option value="">Selecciona un tipo de servicio</option>
                          {tiposServicio.map(tipo => (
                            <option key={tipo.value} value={tipo.value}>
                              {tipo.label} - {tipo.descripcion}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Descripción */}
                      <div className="mb-3">
                        <label htmlFor="descripcion" className="form-label">
                          <i className="bi bi-card-text me-2"></i>
                          Descripción del Servicio * 
                          <small className="text-muted">({formData.descripcion.length}/500)</small>
                        </label>
                        <textarea
                          id="descripcion"
                          name="descripcion"
                          value={formData.descripcion}
                          onChange={handleChange}
                          className="form-control"
                          rows="4"
                          maxLength="500"
                          placeholder="Describe detalladamente qué servicio necesitas..."
                          required
                        />
                      </div>

                      {/* Dirección */}
                      <div className="mb-3">
                        <label htmlFor="direccion" className="form-label">
                          <i className="bi bi-geo-alt me-2"></i>
                          Dirección *
                        </label>
                        <input
                          type="text"
                          id="direccion"
                          name="direccion"
                          value={formData.direccion}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="Dirección completa donde se realizará el servicio"
                          required
                        />
                      </div>

                      {/* Teléfono */}
                      <div className="mb-3">
                        <label htmlFor="telefono" className="form-label">
                          <i className="bi bi-telephone me-2"></i>
                          Teléfono de Contacto
                        </label>
                        <input
                          type="tel"
                          id="telefono"
                          name="telefono"
                          value={formData.telefono}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="Número de teléfono para coordinar"
                        />
                      </div>

                      {/* Aviso importante */}
                      <div className="alert alert-info mb-4">
                        <i className="bi bi-info-circle me-2"></i>
                        <strong>Importante:</strong> Las solicitudes deben realizarse con un mínimo de <strong>24 horas de anticipación</strong>. 
                        Los servicios están disponibles de lunes a sábado de 8:00 AM a 6:00 PM.
                      </div>

                      {/* Fecha y Hora Preferida */}
                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label htmlFor="fechaPreferida" className="form-label">
                              <i className="bi bi-calendar-date me-2"></i>
                              Fecha Preferida *
                            </label>
                            <input
                              type="date"
                              id="fechaPreferida"
                              name="fechaPreferida"
                              value={formData.fechaPreferida}
                              onChange={handleChange}
                              className={`form-control ${formData.fechaPreferida && formData.horaPreferida && !validateDateTime(formData.fechaPreferida, formData.horaPreferida) ? 'is-invalid' : ''}`}
                              min={getMinDate()}
                              required
                            />
                            {formData.fechaPreferida && formData.horaPreferida && !validateDateTime(formData.fechaPreferida, formData.horaPreferida) && (
                              <div className="invalid-feedback">
                                <i className="bi bi-exclamation-triangle me-1"></i>
                                Debe ser con mínimo 24 horas de anticipación
                              </div>
                            )}
                            <div className="form-text">
                              <i className="bi bi-calendar-check me-1"></i>
                              Seleccione la fecha que prefiere para el servicio
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label htmlFor="horaPreferida" className="form-label">
                              <i className="bi bi-clock me-2"></i>
                              Hora Preferida *
                            </label>
                            <select
                              id="horaPreferida"
                              name="horaPreferida"
                              value={formData.horaPreferida}
                              onChange={handleChange}
                              className={`form-select ${formData.fechaPreferida && formData.horaPreferida && !validateDateTime(formData.fechaPreferida, formData.horaPreferida) ? 'is-invalid' : ''}`}
                              required
                            >
                              <option value="">Seleccionar hora...</option>
                              <option value="08:00">08:00 AM</option>
                              <option value="09:00">09:00 AM</option>
                              <option value="10:00">10:00 AM</option>
                              <option value="11:00">11:00 AM</option>
                              <option value="12:00">12:00 PM</option>
                              <option value="13:00">01:00 PM</option>
                              <option value="14:00">02:00 PM</option>
                              <option value="15:00">03:00 PM</option>
                              <option value="16:00">04:00 PM</option>
                              <option value="17:00">05:00 PM</option>
                              <option value="18:00">06:00 PM</option>
                            </select>
                            {formData.fechaPreferida && formData.horaPreferida && !validateDateTime(formData.fechaPreferida, formData.horaPreferida) && (
                              <div className="invalid-feedback">
                                <i className="bi bi-exclamation-triangle me-1"></i>
                                Debe ser con mínimo 24 horas de anticipación
                              </div>
                            )}
                            <div className="form-text">
                              <i className="bi bi-clock-history me-1"></i>
                              Horario de atención: 8:00 AM - 6:00 PM (Lun-Sáb)
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Validación visual tiempo real */}
                      {formData.fechaPreferida && formData.horaPreferida && validateDateTime(formData.fechaPreferida, formData.horaPreferida) && (
                        <div className="alert alert-success mb-3">
                          <i className="bi bi-check-circle me-2"></i>
                          <strong>Perfecto!</strong> La fecha y hora seleccionada cumple con el mínimo de 24 horas de anticipación.
                        </div>
                      )}

                      <button
                        type="submit"
                        className="btn btn-primary btn-lg w-100"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Enviando...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-send me-2"></i>
                            Enviar Solicitud
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
              
              <div className="col-lg-4">
                <div className="card bg-light">
                  <div className="card-body">
                    <h6 className="card-title">
                      <i className="bi bi-info-circle me-2"></i>
                      Información Importante
                    </h6>
                    <ul className="list-unstyled">
                      <li className="mb-2">
                        <i className="bi bi-check-circle text-success me-2"></i>
                        <small>Responderemos tu solicitud en 24-48 horas</small>
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-check-circle text-success me-2"></i>
                        <small>Servicio disponible en San Miguel de Tucumán</small>
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-check-circle text-success me-2"></i>
                        <small>Técnicos especializados y certificados</small>
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-check-circle text-success me-2"></i>
                        <small>Garantía en todos nuestros trabajos</small>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'historial' && (
            <div className="row">
              <div className="col-12">
                {misSolicitudes.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-inbox" style={{ fontSize: '4rem', color: '#6c757d' }}></i>
                    <h4 className="mt-3 text-muted">No tienes solicitudes de servicio</h4>
                    <p className="text-muted">Cuando solicites servicios, aparecerán aquí</p>
                    <button 
                      className="btn btn-primary"
                      onClick={() => setActiveTab('solicitar')}
                    >
                      Solicitar Primer Servicio
                    </button>
                  </div>
                ) : (
                  <div className="row">
                    {misSolicitudes.map(solicitud => (
                      <div key={solicitud.idSolicitud} className="col-md-6 col-lg-4 mb-4">
                        <div className="card h-100">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="card-title text-capitalize">
                                {solicitud.tipoServicio.replace('_', ' ')}
                              </h6>
                              {getEstadoBadge(solicitud.estado)}
                            </div>
                            
                            <p className="card-text small text-muted">
                              {solicitud.descripcion.length > 100 
                                ? solicitud.descripcion.substring(0, 100) + '...'
                                : solicitud.descripcion}
                            </p>
                            
                            <div className="small text-muted">
                              <div className="mb-1">
                                <i className="bi bi-geo-alt me-1"></i>
                                {solicitud.direccion}
                              </div>
                              <div className="mb-1">
                                <i className="bi bi-calendar me-1"></i>
                                {new Date(solicitud.fechaCreacion).toLocaleDateString()}
                              </div>
                              {solicitud.fechaPreferida && (
                                <div className="mb-1">
                                  <i className="bi bi-clock me-1"></i>
                                  {new Date(solicitud.fechaPreferida).toLocaleDateString()}
                                  {solicitud.horaPreferida && ` ${solicitud.horaPreferida}`}
                                </div>
                              )}
                            </div>
                            
                            {solicitud.observacionesAdmin && (
                              <div className="mt-2 p-2 bg-light rounded">
                                <small className="fw-bold text-primary">Observaciones:</small>
                                <br />
                                <small>{solicitud.observacionesAdmin}</small>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div 
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: toastMessage.includes('❌') ? '#dc3545' : '#28a745',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 9999,
            maxWidth: '400px'
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}