import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import '../stylos/admin/Admin.css';
import '../stylos/admin/Productos.css';

function Productos() {
  const [productos, setProductos] = useState([]);
  const [stockSucursal, setStockSucursal] = useState([]);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [editFieldErrors, setEditFieldErrors] = useState({});
  const [deleteError, setDeleteError] = useState(null);
  const [editProd, setEditProd] = useState(null);
  const [deleteProd, setDeleteProd] = useState(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', precio: '', stockTotal: '' });
  const [success, setSuccess] = useState(null);
  const [addProd, setAddProd] = useState(false);
  const [addForm, setAddForm] = useState({ nombre: '', descripcion: '', precio: '', stockTotal: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [editSucursal, setEditSucursal] = useState(null); // { idSucursal, idProducto, nombreProducto, stockDisponible }
  const [sucursales, setSucursales] = useState([]);
  // Asignación exclusiva: 'ALL' para todas o idSucursal específico
  const [sucursalAssignment, setSucursalAssignment] = useState('ALL');
  const [showBackfillModal, setShowBackfillModal] = useState(false);
  // reconcile modal removed: reconciliación ahora desde Herramientas -> Reconciliar producto
  const [showSelectReconcileModal, setShowSelectReconcileModal] = useState(false);
  const [selectedProductForReconcile, setSelectedProductForReconcile] = useState(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef(null);

  // Cerrar menú de herramientas al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (addProd) {
      // Scroll hacia arriba cuando se abre el modal de agregar producto
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [addProd]);

  useEffect(() => {
    const handleDocClick = (e) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target)) {
        setToolsOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setToolsOpen(false);
    };
    document.addEventListener('mousedown', handleDocClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDocClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  useEffect(() => {
    api.get('/productos')
      .then(res => setProductos(res.data))
      .catch(() => setError('Error al obtener productos'));
    // Obtener stock por sucursal
    api.get('/stock_sucursal')
      .then(res => setStockSucursal(res.data))
      .catch(() => {});
    // Obtener lista de sucursales
    api.get('/sucursales')
      .then(res => setSucursales(res.data))
      .catch(() => {});
  }, [success]);

  const handleEdit = (prod) => {
    setEditProd(prod);
    setForm({ nombre: prod.nombre, descripcion: prod.descripcion, precio: prod.precio, stockTotal: prod.stock });
  };

  const handleDelete = (prod) => {
    setDeleteProd(prod);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Validación en tiempo real para edición
    const { name, value } = e.target;
    let errors = { ...editFieldErrors };
    if (value.trim() === '') {
      errors[name] = 'Este campo es obligatorio';
    } else {
      delete errors[name];
    }
    if (name === 'precio') {
      if (!value || isNaN(value) || Number(value) <= 0) {
        errors.precio = 'El precio debe ser mayor a 0';
      } else {
        delete errors.precio;
      }
    }
    if (name === 'stockTotal') {
      if (!value || isNaN(value) || Number(value) < 0) {
        errors.stockTotal = 'El stock debe ser 0 o mayor';
      } else {
        delete errors.stockTotal;
      }
    }
    setEditFieldErrors(errors);
  };

  const handleAddChange = (e) => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      // Crear preview de la imagen
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedImage(null);
      setImagePreview(null);
    }
  };

  const handleMultipleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSelectedImages(files);
      
      // Crear previews para todas las imágenes
      const previews = [];
      let loadedCount = 0;
      
      files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          previews[index] = reader.result;
          loadedCount++;
          if (loadedCount === files.length) {
            setImagePreviews([...previews]);
          }
        };
        reader.readAsDataURL(file);
      });
    } else {
      setSelectedImages([]);
      setImagePreviews([]);
    }
  };

  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  const submitEdit = (e) => {
    e.preventDefault();
    // Validación final antes de enviar
    const errors = {};
    const nombre = form.nombre.trim();
    const descripcion = form.descripcion.trim();
    if (!nombre) errors.nombre = 'El nombre es obligatorio';
    if (!descripcion) errors.descripcion = 'La descripción es obligatoria';
    if (!form.precio || isNaN(form.precio) || Number(form.precio) <= 0) errors.precio = 'El precio debe ser mayor a 0';
    if (!form.stockTotal || isNaN(form.stockTotal) || Number(form.stockTotal) < 0) errors.stockTotal = 'El stock debe ser 0 o mayor';
    setEditFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    api.put(`/productos/${editProd.idProducto}`, { ...form, nombre, descripcion, stockTotal: form.stockTotal })
      .then(() => {
        setSuccess('Producto actualizado correctamente');
        setEditProd(null);
        setEditFieldErrors({});
        setError(null);
      })
      .catch((err) => {
        let msg = 'Error al actualizar producto';
        if (err.response && err.response.data && err.response.data.message) {
          msg = err.response.data.message;
        }
        setError(msg);
      });
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/productos/${deleteProd.idProducto}`);
      setSuccess('Producto eliminado correctamente');
      setDeleteProd(null);
      setDeleteError(null);
      setError(null);
    } catch (err) {
      let msg = 'Error al eliminar producto';
      if (err && err.response && err.response.data && err.response.data.message) {
        msg = err.response.data.message;
      }
      setDeleteError(msg);
    }
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const submitAdd = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    
    // Validación y limpieza
    const errors = {};
    const nombre = addForm.nombre.trim();
    const descripcion = addForm.descripcion.trim();
    if (!nombre) errors.nombre = 'El nombre es obligatorio';
    if (!descripcion) errors.descripcion = 'La descripción es obligatoria';
    if (!addForm.precio || isNaN(addForm.precio) || Number(addForm.precio) <= 0) errors.precio = 'El precio debe ser mayor a 0';
    if (!addForm.stockTotal || isNaN(addForm.stockTotal) || Number(addForm.stockTotal) < 0) errors.stockTotal = 'El stock debe ser 0 o mayor';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setAddLoading(false);
      return;
    }
    
    // Resolver listado de sucursales según la asignación exclusiva
    let sucursalesIds = [];
    if (sucursalAssignment === 'ALL') {
      sucursalesIds = sucursales.map(s => s.idSucursal);
    } else if (sucursalAssignment !== '' && sucursalAssignment !== null && typeof sucursalAssignment !== 'undefined') {
      sucursalesIds = [Number(sucursalAssignment)];
    }
    
    // Crear FormData para enviar archivo
    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('descripcion', descripcion);
    formData.append('precio', Number(addForm.precio));
    formData.append('stockTotal', Number(addForm.stockTotal));
    formData.append('sucursales', JSON.stringify(sucursalesIds));
    
    // Agregar múltiples imágenes si fueron seleccionadas
    if (selectedImages.length > 0) {
      selectedImages.forEach((image, index) => {
        formData.append('imagenes', image);
      });
    }
    
    try {
      await api.post('/productos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess('Producto creado correctamente');
      setAddProd(false);
      setAddForm({ nombre: '', descripcion: '', precio: '', stockTotal: '' });
      setFieldErrors({});
      setSucursalAssignment('ALL');
      setSelectedImages([]);
      setImagePreviews([]);
      setSelectedImage(null);
      setImagePreview(null);
      setSelectedImage(null);
      setImagePreview(null);
      setError(null);
    } catch (err) {
      let msg = 'Error al crear producto';
      if (err.response && err.response.data && err.response.data.message) {
        msg = err.response.data.message;
      }
      setError(msg);
    } finally {
      setAddLoading(false);
    }
  };


  const runBackfill = async () => {
    try {
      await api.post('/stock_sucursal/backfill');
      setSuccess('Backfill ejecutado: filas faltantes creadas');
    } catch {
      setError('Error al ejecutar backfill');
    }
  };

  // preparar lista de sucursales única para columnas
  const sucursalesList = stockSucursal.reduce((acc, cur) => {
    if (!acc.find(s => s.idSucursal === cur.idSucursal)) acc.push({ idSucursal: cur.idSucursal, nombreSucursal: cur.nombreSucursal });
    return acc;
  }, []);

  return (
    <div className="productos-page">
      <div className="productos-header-container">
        <h2 className="productos-title">Productos</h2>
  <div ref={toolsRef} className="productos-tools-container">
          <button className="btn btn-success" onClick={() => setAddProd(true)}>
            <i className="bi bi-plus-circle me-1"></i> Agregar producto
          </button>
          <button className="btn btn-secondary ms-2" onClick={() => setToolsOpen(!toolsOpen)} title="Herramientas">Herramientas <i className="bi bi-caret-down-fill ms-1"></i></button>
          {toolsOpen && (
            <div className="productos-tools-dropdown card shadow-sm">
              <div className="list-group list-group-flush">
                <button className="list-group-item list-group-item-action" title="Crea o actualiza filas/columnas faltantes en el inventario" aria-label="Actualizar filas y columnas faltantes" onClick={() => { setToolsOpen(false); setShowBackfillModal(true); }}>
                  <i className="bi bi-kanban me-2"></i> Actualizar filas y columnas faltantes
                  <span className="small text-muted d-block">Crea filas faltantes por sucursal (stock=0) y actualiza la estructura.</span>
                </button>
                <button className="list-group-item list-group-item-action" title="Ajusta los stocks de cada sucursal para que la suma coincida con el stock total del producto" aria-label="Alinear stock por producto" onClick={() => { setToolsOpen(false); setShowSelectReconcileModal(true); setSelectedProductForReconcile(productos.length ? productos[0].idProducto : null); }}>
                  <i className="bi bi-sliders me-2"></i> Alinear stock por producto
                  <span className="small text-muted d-block">Ajusta cantidades en sucursales para que sumen al stock total del producto.</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Modal Agregar Producto - Estilo moderno como Login/Register */}
      {addProd && (
        <>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            <div style={{
              background: 'linear-gradient(180deg, #4A90E2 0%, #357ABD 50%, #1E3A8A 100%)',
              borderRadius: '20px',
              padding: '2px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '18px',
                padding: '40px',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.2)',
                textAlign: 'center'
              }}>
                {/* Header con ícono */}
                <div style={{ marginBottom: '30px' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: '#E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    border: '3px solid rgba(255,255,255,0.8)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    <i className="bi bi-plus-circle-fill" style={{ fontSize: '32px', color: '#4A90E2' }}></i>
                  </div>
                  <h5 style={{
                    fontSize: '24px',
                    fontWeight: '500',
                    color: '#374151',
                    margin: 0
                  }}>Agregar Producto</h5>
                </div>

                <form onSubmit={submitAdd} noValidate>
                  {error && (
                    <div style={{
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      padding: '12px',
                      borderRadius: '8px',
                      marginBottom: '20px',
                      fontSize: '14px',
                      border: '1px solid #fecaca'
                    }}>{error}</div>
                  )}

                  {/* Nombre */}
                  <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                    <div style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '8px',
                      border: fieldErrors.nombre ? '1px solid #dc3545' : '1px solid rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.3s ease'
                    }}>
                      <i className="bi bi-tag" style={{ 
                        fontSize: '16px', 
                        color: '#9CA3AF', 
                        marginLeft: '12px',
                        marginRight: '8px'
                      }}></i>
                      <input
                        type="text"
                        name="nombre"
                        value={addForm.nombre}
                        onChange={handleAddChange}
                        placeholder="Nombre del producto *"
                        required
                        style={{
                          flex: 1,
                          padding: '14px 12px 14px 0',
                          border: 'none',
                          backgroundColor: 'transparent',
                          fontSize: '15px',
                          outline: 'none',
                          color: '#374151'
                        }}
                      />
                    </div>
                    {fieldErrors.nombre && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{fieldErrors.nombre}</div>}
                  </div>

                  {/* Descripción */}
                  <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                    <div style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'flex-start',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '8px',
                      border: fieldErrors.descripcion ? '1px solid #dc3545' : '1px solid rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.3s ease'
                    }}>
                      <i className="bi bi-card-text" style={{ 
                        fontSize: '16px', 
                        color: '#9CA3AF', 
                        marginLeft: '12px',
                        marginRight: '8px',
                        marginTop: '14px'
                      }}></i>
                      <textarea
                        name="descripcion"
                        value={addForm.descripcion}
                        onChange={handleAddChange}
                        placeholder="Descripción del producto *"
                        required
                        rows="3"
                        style={{
                          flex: 1,
                          padding: '14px 12px 14px 0',
                          border: 'none',
                          backgroundColor: 'transparent',
                          fontSize: '15px',
                          outline: 'none',
                          color: '#374151',
                          resize: 'vertical',
                          minHeight: '60px'
                        }}
                      />
                    </div>
                    {fieldErrors.descripcion && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{fieldErrors.descripcion}</div>}
                  </div>

                  {/* Múltiples Imágenes del producto */}
                  <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                    <label style={{ 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#374151',
                      marginBottom: '8px',
                      display: 'block'
                    }}>
                      <i className="bi bi-images me-2"></i>
                      Imágenes del producto (máx. 5)
                    </label>
                    <div style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '8px',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      padding: '12px'
                    }}>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleMultipleImagesChange}
                        style={{
                          padding: '8px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          fontSize: '14px',
                          outline: 'none',
                          color: '#374151'
                        }}
                      />
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0' }}>
                        Selecciona hasta 5 imágenes para el producto
                      </p>
                      
                      {/* Previews de múltiples imágenes */}
                      {imagePreviews.length > 0 && (
                        <div style={{ 
                          marginTop: '12px',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                          gap: '12px'
                        }}>
                          {imagePreviews.map((preview, index) => (
                            <div key={index} style={{ position: 'relative' }}>
                              <img 
                                src={preview} 
                                alt={`Preview ${index + 1}`} 
                                style={{
                                  width: '100%',
                                  height: '100px',
                                  borderRadius: '8px',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                  objectFit: 'cover'
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                style={{
                                  position: 'absolute',
                                  top: '4px',
                                  right: '4px',
                                  background: 'rgba(220, 53, 69, 0.9)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '24px',
                                  height: '24px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Eliminar imagen"
                              >
                                ×
                              </button>
                              <p style={{ 
                                fontSize: '10px', 
                                color: '#6b7280', 
                                textAlign: 'center',
                                marginTop: '4px' 
                              }}>
                                Imagen {index + 1}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Precio y Stock en fila */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    {/* Precio */}
                    <div style={{ textAlign: 'left' }}>
                      <div style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '8px',
                        border: fieldErrors.precio ? '1px solid #dc3545' : '1px solid rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s ease'
                      }}>
                        <i className="bi bi-currency-dollar" style={{ 
                          fontSize: '16px', 
                          color: '#9CA3AF', 
                          marginLeft: '12px',
                          marginRight: '8px'
                        }}></i>
                        <input
                          type="number"
                          name="precio"
                          value={addForm.precio}
                          onChange={handleAddChange}
                          placeholder="Precio *"
                          required
                          min="0"
                          step="0.01"
                          style={{
                            flex: 1,
                            padding: '14px 12px 14px 0',
                            border: 'none',
                            backgroundColor: 'transparent',
                            fontSize: '15px',
                            outline: 'none',
                            color: '#374151'
                          }}
                        />
                      </div>
                      {fieldErrors.precio && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{fieldErrors.precio}</div>}
                    </div>

                    {/* Stock */}
                    <div style={{ textAlign: 'left' }}>
                      <div style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '8px',
                        border: fieldErrors.stockTotal ? '1px solid #dc3545' : '1px solid rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s ease'
                      }}>
                        <i className="bi bi-box" style={{ 
                          fontSize: '16px', 
                          color: '#9CA3AF', 
                          marginLeft: '12px',
                          marginRight: '8px'
                        }}></i>
                        <input
                          type="number"
                          name="stockTotal"
                          value={addForm.stockTotal}
                          onChange={handleAddChange}
                          placeholder="Stock *"
                          required
                          min="0"
                          style={{
                            flex: 1,
                            padding: '14px 12px 14px 0',
                            border: 'none',
                            backgroundColor: 'transparent',
                            fontSize: '15px',
                            outline: 'none',
                            color: '#374151'
                          }}
                        />
                      </div>
                      {fieldErrors.stockTotal && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{fieldErrors.stockTotal}</div>}
                    </div>
                  </div>

                  {/* Sucursales */}
                  <div style={{ marginBottom: '24px', textAlign: 'left' }}>
                    <label style={{ 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#374151',
                      marginBottom: '8px',
                      display: 'block'
                    }}>
                      <i className="bi bi-building me-2"></i>
                      Asignar a sucursales
                    </label>
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '8px',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      padding: '12px'
                    }}>
                      <div style={{ marginBottom: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="sucursal-assignment"
                            value="ALL"
                            checked={sucursalAssignment === 'ALL'}
                            onChange={(e) => setSucursalAssignment(e.target.value)}
                            style={{ marginRight: '8px' }}
                          />
                          Todas las sucursales
                        </label>
                      </div>
                      {sucursales.map(s => (
                        <div key={s.idSucursal} style={{ marginBottom: '8px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="sucursal-assignment"
                              value={s.idSucursal}
                              checked={String(sucursalAssignment) === String(s.idSucursal)}
                              onChange={(e) => setSucursalAssignment(e.target.value)}
                              style={{ marginRight: '8px' }}
                            />
                            {s.nombre}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botones */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <button
                      type="submit"
                      disabled={addLoading}
                      style={{
                        padding: '14px',
                        border: 'none',
                        borderRadius: '8px',
                        background: addLoading ? '#9CA3AF' : '#22c55e',
                        color: 'white',
                        fontSize: '15px',
                        fontWeight: '500',
                        cursor: addLoading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => !addLoading && (e.target.style.background = '#16a34a')}
                      onMouseLeave={(e) => !addLoading && (e.target.style.background = '#22c55e')}
                    >
                      {addLoading ? (
                        <>
                          <span style={{ 
                            display: 'inline-block',
                            width: '16px',
                            height: '16px',
                            border: '2px solid #ffffff',
                            borderTop: '2px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            marginRight: '8px'
                          }}></span>
                          CREANDO...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          CREAR
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setAddProd(false)}
                      style={{
                        padding: '14px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        background: 'white',
                        color: '#6b7280',
                        fontSize: '15px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        letterSpacing: '0.5px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#f9fafb';
                        e.target.style.borderColor = '#9ca3af';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'white';
                        e.target.style.borderColor = '#d1d5db';
                      }}
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      CANCELAR
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Stock por sucursal */}
  {/* productos table arriba (se renderiza más abajo) */}
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <div className="productos-table-wrapper mt-3">
        <div className="productos-card">
          <div className="table-responsive">
            <table className="table table-striped table-bordered productos-table">
           <thead className="table-dark">
              <tr>
               <th className="productos-table-header">ID</th>
               <th className="productos-table-header">Nombre</th>
               <th className="productos-table-header">Descripción</th>
               <th className="productos-table-header">Precio</th>
               <th className="productos-table-header">Stock</th>
               <th className="productos-table-header">Acciones</th>
               {sucursalesList.map(s => (
                 <th key={s.idSucursal} className="productos-table-header text-center">{s.nombreSucursal}</th>
               ))}
             </tr>
           </thead>
           <tbody>
             {productos.map(p => (
               <tr key={p.idProducto}>
                 <td className="align-middle">{p.idProducto}</td>
                 <td className="align-middle">{p.nombre}</td>
                 <td className="productos-descripcion-cell">
                   <div className="productos-descripcion-text" title={p.descripcion}>{p.descripcion}</div>
                 </td>
                 <td className="align-middle">${p.precio}</td>
                 <td className="align-middle">{p.stock}</td>
                 <td className="align-middle">
                  <div className="productos-actions-container">
                    <button className="btn btn-sm btn-primary" onClick={() => handleEdit(p)}>
                      <i className="bi bi-pencil me-1"></i> Editar
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p)}>
                      <i className="bi bi-trash me-1"></i> Eliminar
                    </button>
                    {/* Reconciliación ahora disponible desde Herramientas -> Reconciliar producto */}
                  </div>
                 </td>
                 {sucursalesList.map(s => {
                   const stockRow = stockSucursal.find(ss => ss.idProducto === p.idProducto && ss.idSucursal === s.idSucursal);
                   return <td key={`${p.idProducto}-${s.idSucursal}`} className="text-center align-middle">{stockRow ? stockRow.stockDisponible : 0}</td>;
                 })}
               </tr>
             ))}
           </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Stock por sucursal: grid de dos columnas en pantallas grandes */}
      <div className="productos-stock-grid">
        {stockSucursal && stockSucursal.length === 0 && <div className="text-muted">No hay datos de stock por sucursal</div>}
        {stockSucursal && stockSucursal.length > 0 && (
          Object.entries(stockSucursal.reduce((acc, cur) => {
            const key = `${cur.idSucursal}::${cur.nombreSucursal}`;
            acc[key] = acc[key] || [];
            acc[key].push(cur);
            return acc;
          }, {})).map(([key, items]) => {
            const [, nombreSucursal] = key.split('::');
            return (
              <div key={key} className="mb-4">
                  <h5 className="productos-sucursal-title">{nombreSucursal}</h5>
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered">
                      <thead className="table-dark text-center">
                        <tr>
                          <th>Producto</th>
                          <th>Stock Disponible</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(it => (
                          <tr key={`${it.idSucursal}-${it.idProducto}`}>
                            <td>{it.nombreProducto}</td>
                            <td className="text-center align-middle">{it.stockDisponible}</td>
                            <td className="text-center align-middle">
                              <button className="btn btn-sm btn-primary" onClick={() => setEditSucursal({ idSucursal: it.idSucursal, idProducto: it.idProducto, nombreProducto: it.nombreProducto, stockDisponible: it.stockDisponible })}>
                                <i className="bi bi-pencil me-1"></i> Editar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
            );
          })
        )}
      </div>
      {/* Modal Edición */}
      {editProd && (
        <div className="productos-modal-backdrop">
          <div className="productos-modal-dialog-lg">
            <div className="productos-modal-content">
              <form onSubmit={submitEdit} noValidate className="productos-form">
                <div className="modal-header">
                  <h5 className="modal-title">Editar Producto</h5>
                  <button type="button" className="btn-close" onClick={() => setEditProd(null)}></button>
                </div>
                <div className="productos-modal-body">
                  {error && (
                    <div className="productos-alert-danger">{error}</div>
                  )}
                  <div className="mb-2">
                    <label>Nombre</label>
                    <input type="text" className={`form-control${editFieldErrors.nombre ? ' is-invalid' : ''}`} name="nombre" value={form.nombre} onChange={handleChange} required />
                    <div className="productos-field-error">
                      {editFieldErrors.nombre && <span className="invalid-feedback d-block">{editFieldErrors.nombre}</span>}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label>Descripción</label>
                    <input type="text" className={`form-control${editFieldErrors.descripcion ? ' is-invalid' : ''}`} name="descripcion" value={form.descripcion} onChange={handleChange} required />
                    <div className="productos-field-error">
                      {editFieldErrors.descripcion && <span className="invalid-feedback d-block">{editFieldErrors.descripcion}</span>}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label>Precio</label>
                    <input type="number" className={`form-control${editFieldErrors.precio ? ' is-invalid' : ''}`} name="precio" value={form.precio} onChange={handleChange} required min="0" />
                    <div className="productos-field-error">
                      {editFieldErrors.precio && <span className="invalid-feedback d-block">{editFieldErrors.precio}</span>}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label>Stock</label>
                    <input type="number" className={`form-control${editFieldErrors.stockTotal ? ' is-invalid' : ''}`} name="stockTotal" value={form.stockTotal} onChange={handleChange} required min="0" />
                    <div className="productos-field-error">
                      {editFieldErrors.stockTotal && <span className="invalid-feedback d-block">{editFieldErrors.stockTotal}</span>}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-success">Guardar cambios</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditProd(null)}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar stock por sucursal */}
      {editSucursal && (
        <div className="productos-modal-backdrop">
          <div className="productos-modal-dialog">
            <div className="productos-modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Editar stock - {editSucursal.nombreProducto} (Sucursal {editSucursal.idSucursal})</h5>
                <button type="button" className="btn-close" onClick={() => setEditSucursal(null)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label>Stock Disponible</label>
                  <input type="number" className={`form-control`} name="stockDisponible" value={editSucursal.stockDisponible} onChange={(e) => setEditSucursal({ ...editSucursal, stockDisponible: e.target.value })} min="0" />
                </div>
                <div className="text-muted small">Solo se modifica el stock de este producto en la sucursal seleccionada; el stock total del producto se ajustará automáticamente.</div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-success" onClick={async () => {
                  try {
                    const payload = { stockDisponible: Number(editSucursal.stockDisponible) };
                    await api.put(`/stock_sucursal/${editSucursal.idSucursal}/${editSucursal.idProducto}`, payload);
                    setSuccess('Stock actualizado correctamente');
                    setEditSucursal(null);
                    setError(null);
                  } catch (err) {
                    let msg = 'Error al actualizar stock';
                    if (err && err.response && err.response.data && err.response.data.error) msg = err.response.data.error;
                    setError(msg);
                  }
                }}>Guardar</button>
                <button className="btn btn-secondary" onClick={() => setEditSucursal(null)}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Borrado */}
      {deleteProd && (
        <div className="productos-modal-backdrop">
          <div className="productos-modal-dialog">
            <div className="productos-modal-content">
              <div className="modal-header">
                <h5 className="modal-title">¿Eliminar producto?</h5>
                <button type="button" className="btn-close" onClick={() => { setDeleteProd(null); setDeleteError(null); }}></button>
              </div>
              <div className="modal-body">
                {deleteError && <div className="productos-alert-danger">{deleteError}</div>}
                <p>¿Estás seguro que quieres eliminar <b>{deleteProd.nombre}</b>? Esta acción no se puede deshacer.</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-danger" onClick={confirmDelete}>Eliminar</button>
                <button className="btn btn-secondary" onClick={() => { setDeleteProd(null); setDeleteError(null); }}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    {/* Confirmación: actualizar filas/columnas faltantes */}
    {showBackfillModal && (
      <div className="productos-modal-backdrop">
        <div className="productos-modal-dialog">
          <div className="productos-modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Actualizar filas y columnas faltantes</h5>
              <button className="btn-close" onClick={() => setShowBackfillModal(false)}></button>
            </div>
            <div className="modal-body">
              <p>Esta acción creará o actualizará las filas y columnas faltantes en el inventario por sucursal para todos los productos. Las filas creadas tendrán stock=0 por defecto. ¿Deseas continuar?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={async () => { await runBackfill(); setShowBackfillModal(false); }}>Actualizar</button>
              <button className="btn btn-secondary" onClick={() => setShowBackfillModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Reconcile confirmation modal removed; use Herramientas -> Reconciliar producto */}
    {/* Seleccionar producto para alinear stock por sucursal (desde Herramientas) */}
    {showSelectReconcileModal && (
      <div className="productos-modal-backdrop">
        <div className="productos-modal-dialog">
          <div className="productos-modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Alinear stock por sucursal (producto)</h5>
              <button className="btn-close" onClick={() => { setShowSelectReconcileModal(false); setSelectedProductForReconcile(null); }}></button>
            </div>
            <div className="modal-body">
              <p>Selecciona el producto que deseas alinear. Esta acción ajustará los stocks de cada sucursal para que su suma coincida con el stock total del producto.</p>
              <div className="mb-2">
                <label>Producto</label>
                <select className="form-select" value={selectedProductForReconcile ?? ''} onChange={(e) => setSelectedProductForReconcile(Number(e.target.value))}>
                  <option value="" disabled>-- Selecciona --</option>
                  {productos.map(p => (
                    <option key={p.idProducto} value={p.idProducto}>{p.nombre} (ID: {p.idProducto})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={async () => {
                if (!selectedProductForReconcile) return setError('Selecciona un producto para alinear');
                try {
                  await api.post(`/productos/${selectedProductForReconcile}/reconcile`);
                  setSuccess('Alineación ejecutada');
                } catch {
                  setError('Error al alinear stock');
                }
                setShowSelectReconcileModal(false);
                setSelectedProductForReconcile(null);
              }}>Alinear</button>
              <button className="btn btn-secondary" onClick={() => { setShowSelectReconcileModal(false); setSelectedProductForReconcile(null); }}>Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}

export default Productos;