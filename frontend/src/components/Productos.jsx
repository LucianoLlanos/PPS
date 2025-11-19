import { useEffect, useState, useRef, useMemo } from 'react';
import api from '../api/axios';
import '../stylos/admin/Admin.css';
import '../stylos/admin/Productos.css';
import { Box, Typography, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button, Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, IconButton, RadioGroup, FormControlLabel, Radio, InputAdornment, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { formatCurrency } from '../utils/format';

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
  // single image legacy removed (usamos multiple images)
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imagesToRemove, setImagesToRemove] = useState([]);
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
  // refs for edit/delete modals not needed currently (kept inline overlays)
  
  // Estados para filtros de la tabla
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroSucursal, setFiltroSucursal] = useState('');
  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  // Persistir sort principal en sessionStorage para mantener orden al cambiar páginas
  const [sortField, setSortField] = useState(() => sessionStorage.getItem('productos:sortField') || null);
  const [sortOrder, setSortOrder] = useState(() => sessionStorage.getItem('productos:sortOrder') || 'asc');

  // Cerrar menú de herramientas al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (addProd) {
      // Scroll instantáneo para evitar barra de scroll transitoria al abrir modal
      window.scrollTo(0, 0);
    }
  }, [addProd]);

  // Si cualquier modal está abierto: bloqueo de scroll del body y Escape para cerrar el modal activo
  useEffect(() => {
    const anyOpen = addProd || editProd || deleteProd || editSucursal || showBackfillModal || showSelectReconcileModal;
    if (!anyOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (addProd) setAddProd(false);
        if (editProd) setEditProd(null);
        if (deleteProd) setDeleteProd(null);
        if (editSucursal) setEditSucursal(null);
        if (showBackfillModal) setShowBackfillModal(false);
        if (showSelectReconcileModal) setShowSelectReconcileModal(false);
      }
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous || '';
      document.removeEventListener('keydown', onKey);
    };
  }, [addProd, editProd, deleteProd, editSucursal, showBackfillModal, showSelectReconcileModal]);

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
    api.get('/admin/productos')
      .then(res => setProductos(res.data))
      .catch(() => setError('Error al obtener productos'));
    // Obtener stock por sucursal
    api.get('/admin/stock_sucursal')
      .then(res => setStockSucursal(res.data))
      .catch(() => {});
    // Obtener lista de sucursales
    api.get('/admin/sucursales')
      .then(res => setSucursales(res.data))
      .catch(() => {});
  }, [success]);

  const handleEdit = (prod) => {
    setEditProd(prod);
    setForm({ nombre: prod.nombre, descripcion: prod.descripcion, precio: prod.precio, stockTotal: prod.stock });
    // inicializar previews con las imágenes existentes del producto (si las hay)
    let existing = Array.isArray(prod.imagenes) ? [...prod.imagenes] : [];
    // Fallback defensivo: si no vino el array pero hay imagen principal legacy
    if ((!existing || existing.length === 0) && prod.imagen) {
      existing = [prod.imagen];
    }
    console.log('[DEBUG handleEdit] Producto seleccionado:', prod.idProducto, prod.nombre);
    console.log('[DEBUG handleEdit] Imagenes recibidas:', prod.imagenes);
    console.log('[DEBUG handleEdit] Imagen principal legacy:', prod.imagen);
    console.log('[DEBUG handleEdit] Previews iniciales:', existing);
    setImagePreviews(existing);
    setSelectedImages([]);
    setImagesToRemove([]); // limpiar posibles eliminaciones previas

    // Refresco en caliente: si por alguna razón /admin/productos no trajo todas las imágenes,
    // consultamos el endpoint público /productos (que ya sabemos que incluye todas) y actualizamos las previews.
    // Esto evita depender de un full reload si el backend cambió.
    try {
      api.get('/productos').then(res => {
        if (res && Array.isArray(res.data)) {
          const full = res.data.find(p => Number(p.idProducto) === Number(prod.idProducto));
          if (full && Array.isArray(full.imagenes) && full.imagenes.length > 0) {
            console.log('[DEBUG handleEdit] Imagenes desde /productos:', full.imagenes);
            setImagePreviews(prev => {
              // Si ya había previews (fallback) y son distintas, las reemplazamos por el set completo del endpoint público
              const hadOnlyLegacy = prev.length <= 1;
              return hadOnlyLegacy ? [...full.imagenes] : prev;
            });
          }
        }
      }).catch(() => {});
    } catch {}
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

  // single image handler removed; usamos handleMultipleImagesChange

  const handleMultipleImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    // máximo total 5 (existentes + nuevas)
    const currentCount = imagePreviews.length;
    const allowed = Math.max(0, 5 - currentCount);
    const toAdd = files.slice(0, allowed);
    if (toAdd.length === 0) return;

    // append new File objects to selectedImages
    setSelectedImages((prev) => [...prev, ...toAdd]);

    // crear previews para los nuevos archivos y añadir a imagePreviews
    const readers = toAdd.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });
    Promise.all(readers).then((newPreviews) => {
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    });
    // reset input value to allow selecting same file again
    e.target.value = null;
  };

  const removeImage = (index) => {
    // Determine if the removed preview corresponds to a locally selected file
    const totalPreviews = imagePreviews.length;
    const localCount = selectedImages.length;
    const localStart = totalPreviews - localCount;

    if (index >= localStart) {
      // it's a local file
      const localIndex = index - localStart;
      setSelectedImages((prev) => prev.filter((_, i) => i !== localIndex));
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    } else {
      // it's an existing server image; mark for removal and remove preview
      const filename = imagePreviews[index];
      setImagesToRemove((prev) => [...prev, filename]);
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
      // Note: existing server-side image rows will be removed on submit if backend supports it
    }
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
    // Enviar como multipart/form-data si hay imágenes nuevas O si se eliminaron imágenes existentes
    // (antes sólo se enviaba FormData cuando había nuevas imágenes, impidiendo borrar sin añadir)
    if ((selectedImages && selectedImages.length > 0) || (imagesToRemove && imagesToRemove.length > 0)) {
      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('descripcion', descripcion);
      formData.append('precio', Number(form.precio));
      formData.append('stockTotal', Number(form.stockTotal));
      // anexar imágenes nuevas
      for (const img of selectedImages) formData.append('imagenes', img);
      // anexar lista de imágenes a eliminar (si aplica)
      if (imagesToRemove && imagesToRemove.length > 0) {
        formData.append('removeImages', JSON.stringify(imagesToRemove));
      }
      api.put(`/admin/productos/${editProd.idProducto}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        .then(() => {
          setSuccess('Producto actualizado correctamente');
          setEditProd(null);
          setEditFieldErrors({});
          setError(null);
          setSelectedImages([]);
          setImagePreviews([]);
          setImagesToRemove([]);
        })
        .catch((err) => {
          let msg = 'Error al actualizar producto';
          if (err.response && err.response.data && err.response.data.message) {
            msg = err.response.data.message;
          }
          setError(msg);
        });
    } else {
      // Camino sin cambios de imágenes: permitir también enviar lista vacía explícita si se quisiera ampliar en futuro
      api.put(`/admin/productos/${editProd.idProducto}`, { ...form, nombre, descripcion, stockTotal: form.stockTotal })
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
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/admin/productos/${deleteProd.idProducto}`);
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
      for (const img of selectedImages) formData.append('imagenes', img);
    }
    
    try {
      await api.post('/admin/productos', formData, {
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
  // limpiamos previews e imágenes múltiples
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

  // Función para filtrar productos
  const productosFiltrados = productos.filter(p => {
    const nombreMatch = p.nombre.toLowerCase().includes(filtroNombre.toLowerCase());
    return nombreMatch;
  });

  // pagination helpers
  // apply sorting
  const productosFiltradosSorted = (() => {
    const arr = [...productosFiltrados];
    if (!sortField) return arr;
    arr.sort((a, b) => {
      if (sortField === 'precio' || sortField === 'stock') {
        const va = Number(a[sortField] ?? 0);
        const vb = Number(b[sortField] ?? 0);
        return sortOrder === 'asc' ? va - vb : vb - va;
      }
      const sa = String(a[sortField] ?? '').toLowerCase();
      const sb = String(b[sortField] ?? '').toLowerCase();
      if (sa < sb) return sortOrder === 'asc' ? -1 : 1;
      if (sa > sb) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  })();

  const totalPages = Math.max(1, Math.ceil(productosFiltradosSorted.length / pageSize));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const productosFiltradosPaged = productosFiltradosSorted.slice(startIndex, endIndex);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Guardar en sessionStorage cuando cambie el sort principal
  useEffect(() => {
    try {
      if (sortField) sessionStorage.setItem('productos:sortField', sortField);
      else sessionStorage.removeItem('productos:sortField');
      if (sortOrder) sessionStorage.setItem('productos:sortOrder', sortOrder);
      else sessionStorage.removeItem('productos:sortOrder');
    } catch {
      // sessionStorage puede fallar en entornos restringidos; ignorar
    }
  }, [sortField, sortOrder]);

  // Filtrar stock por sucursal: usar los productos filtrados por nombre (por id) y filtrar por nombre de sucursal
  const filteredProductIds = new Set(productosFiltrados.map(p => p.idProducto));
  const stockFiltrado = stockSucursal.filter(s => {
    const productMatch = filteredProductIds.size === 0 ? true : filteredProductIds.has(s.idProducto);
    const sucursalMatch = filtroSucursal === '' || s.nombreSucursal.toLowerCase().includes(filtroSucursal.toLowerCase());
    return productMatch && sucursalMatch;
  });

  // Small subcomponent: table for each sucursal with sorting & pagination
  function StockTable({ items, nombreSucursal, idSucursal, onEdit }) {
    const [page, setPage] = useState(1);
    const [pageSizeLocal, setPageSizeLocal] = useState(6);
    // Persistir sort local por sucursal usando idSucursal como sufijo
    const keyField = idSucursal ? `productos:stock:${idSucursal}:sortField` : null;
    const keyOrder = idSucursal ? `productos:stock:${idSucursal}:sortOrder` : null;
    const [sortFieldLocal, setSortFieldLocal] = useState(() => {
      try { return keyField ? sessionStorage.getItem(keyField) : null; } catch { return null; }
    });
    const [sortOrderLocal, setSortOrderLocal] = useState(() => {
      try { return keyOrder ? sessionStorage.getItem(keyOrder) || 'asc' : 'asc'; } catch { return 'asc'; }
    });

    // Persistir cambios de sort local
    useEffect(() => {
      try {
        if (keyField) {
          if (sortFieldLocal) sessionStorage.setItem(keyField, sortFieldLocal);
          else sessionStorage.removeItem(keyField);
        }
        if (keyOrder) {
          if (sortOrderLocal) sessionStorage.setItem(keyOrder, sortOrderLocal);
          else sessionStorage.removeItem(keyOrder);
        }
      } catch {
        // ignore storage errors
      }
    }, [keyField, keyOrder, sortFieldLocal, sortOrderLocal]);

    const sorted = useMemo(() => {
      const arr = [...items];
      if (!sortFieldLocal) return arr;
      arr.sort((a,b) => {
        const fa = a[sortFieldLocal];
        const fb = b[sortFieldLocal];
        const na = Number(fa);
        const nb = Number(fb);
        // If both values are numeric, compare numerically
        if (!Number.isNaN(na) && !Number.isNaN(nb)) {
          return sortOrderLocal === 'asc' ? na - nb : nb - na;
        }
        // Fallback to case-insensitive string compare
        const sa = String(fa ?? '').toLowerCase();
        const sb = String(fb ?? '').toLowerCase();
        if (sa < sb) return sortOrderLocal === 'asc' ? -1 : 1;
        if (sa > sb) return sortOrderLocal === 'asc' ? 1 : -1;
        return 0;
      });
      return arr;
    }, [items, sortFieldLocal, sortOrderLocal]);

    const totalPagesLocal = Math.max(1, Math.ceil(sorted.length / pageSizeLocal));
    useEffect(() => { if (page > totalPagesLocal) setPage(totalPagesLocal); }, [page, totalPagesLocal]);
    const start = (page - 1) * pageSizeLocal;
    const paged = sorted.slice(start, start + pageSizeLocal);

    const toggleSortLocal = (f) => {
      if (sortFieldLocal === f) setSortOrderLocal(prev => prev === 'asc' ? 'desc' : 'asc');
      else { setSortFieldLocal(f); setSortOrderLocal('asc'); }
      setPage(1);
    };

    return (
      <div className="mb-4">
        <h5 className="productos-sucursal-title">
          <i className="bi bi-building me-2"></i>
          {nombreSucursal}
          <span className="badge bg-secondary ms-2">{items.length} productos</span>
        </h5>
        <TableContainer component={Paper} sx={{ maxHeight: 400, mb: 1 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell onClick={() => toggleSortLocal('nombre')} sx={{ cursor: 'pointer' }}>Producto {sortFieldLocal === 'nombre' ? (sortOrderLocal === 'asc' ? '▴' : '▾') : ''}</TableCell>
                <TableCell align="center" onClick={() => toggleSortLocal('stockDisponible')} sx={{ cursor: 'pointer' }}>Stock Disponible {sortFieldLocal === 'stockDisponible' ? (sortOrderLocal === 'asc' ? '▴' : '▾') : ''}</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map(it => (
                <TableRow key={`${it.idSucursal}-${it.idProducto}`} hover>
                  <TableCell>{it.nombreProducto}</TableCell>
                  <TableCell align="center">{it.stockDisponible}</TableCell>
                  <TableCell align="center"><Button size="small" variant="contained" onClick={() => onEdit({ idSucursal: it.idSucursal, idProducto: it.idProducto, nombreProducto: it.nombreProducto, stockDisponible: it.stockDisponible })}>Editar</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* pagination local */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">Filas</Typography>
            <FormControl size="small">
              <Select value={pageSizeLocal} onChange={(e) => { setPageSizeLocal(Number(e.target.value)); setPage(1); }} sx={{ width: 80 }}>
                <MenuItem value={3}>3</MenuItem>
                <MenuItem value={6}>6</MenuItem>
                <MenuItem value={10}>10</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button size="small" variant="outlined" disabled={page === 1} onClick={() => setPage(1)}>«</Button>
            <Button size="small" variant="outlined" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>‹</Button>
            <Typography variant="body2">Página {page} de {totalPagesLocal}</Typography>
            <Button size="small" variant="outlined" disabled={page === totalPagesLocal} onClick={() => setPage(p => Math.min(totalPagesLocal, p + 1))}>›</Button>
            <Button size="small" variant="outlined" disabled={page === totalPagesLocal} onClick={() => setPage(totalPagesLocal)}>»</Button>
          </Box>
        </Box>
      </div>
    );
  }

  return (
    <Box sx={{ width: '100%', py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, system-ui' }}>Productos</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }} ref={toolsRef}>
          <Button variant="contained" color="success" onClick={() => setAddProd(true)} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600 }}>Agregar producto</Button>
          <Button variant="outlined" onClick={() => setToolsOpen(!toolsOpen)} sx={{ borderRadius: 999, textTransform: 'none' }}>Herramientas</Button>
          {toolsOpen && (
            <Box sx={{ position: 'relative' }}>
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
            </Box>
          )}
        </Box>
      </Box>
      {/* Modal Agregar Producto - migrado a MUI Dialog */}
      {addProd && (
        <Box>
          <Dialog
            open={addProd}
            onClose={() => setAddProd(false)}
            fullWidth
            maxWidth="md"
            scroll="paper"
            PaperProps={{ sx: { borderRadius: 3 } }}
          >
            <DialogTitle>Agregar Producto</DialogTitle>
            <DialogContent dividers sx={{ maxHeight: '68vh', overflow: 'auto', pt: 2 }}>
              {error && <Box sx={{ bgcolor: '#fff2f2', color: '#dc2626', p: 2, borderRadius: 1, mb: 2 }}>{error}</Box>}
              <Box component="form" onSubmit={submitAdd} noValidate sx={{ mt: 1 }}>
                <Grid container spacing={2} alignItems="flex-start">
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth size="small" variant="outlined" name="nombre" label="Nombre del producto *" value={addForm.nombre} onChange={handleAddChange} error={!!fieldErrors.nombre} helperText={fieldErrors.nombre || ''} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      variant="outlined"
                      multiline
                      minRows={3}
                      maxRows={6}
                      name="descripcion"
                      label="Descripción *"
                      value={addForm.descripcion}
                      onChange={handleAddChange}
                      error={!!fieldErrors.descripcion}
                      helperText={fieldErrors.descripcion || ''}
                      inputProps={{ style: { maxHeight: 160, overflow: 'auto', padding: '8px' } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth size="small" variant="outlined" type="number" name="precio" label="Precio *" value={addForm.precio} onChange={handleAddChange} error={!!fieldErrors.precio} helperText={fieldErrors.precio || ''} inputProps={{ step: '0.01', min: 0 }} />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth size="small" variant="outlined" type="number" name="stockTotal" label="Stock *" value={addForm.stockTotal} onChange={handleAddChange} error={!!fieldErrors.stockTotal} helperText={fieldErrors.stockTotal || ''} inputProps={{ min: 0 }} />
                      </Grid>
                      <Grid item xs={12}>
                        <InputLabel sx={{ mb: 1 }}>Imágenes del producto (máx.5)</InputLabel>
                        <input type="file" accept="image/*" multiple onChange={handleMultipleImagesChange} />
                        {imagePreviews.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                            {imagePreviews.map((preview, index) => (
                              <Box key={index} sx={{ position: 'relative' }}>
                                <img src={typeof preview === 'string' && preview.startsWith('data:') ? preview : (typeof preview === 'string' ? `http://localhost:3000/uploads/${preview}` : preview)} alt={`Preview ${index+1}`} style={{ width: 100, height: 70, objectFit: 'cover', borderRadius: 8 }} />
                                <IconButton size="small" onClick={() => removeImage(index)} sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff' }}>×</IconButton>
                                <Typography variant="caption" display="block" align="center">Imagen {index+1}</Typography>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Grid>
                      <Grid item xs={12}>
                        <InputLabel sx={{ display: 'block', mb: 1 }}>Asignar a sucursales</InputLabel>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                          <FormControl>
                            <RadioGroup row value={sucursalAssignment} onChange={(e) => setSucursalAssignment(e.target.value)}>
                              <FormControlLabel value="ALL" control={<Radio />} label="Todas las sucursales" />
                              {sucursales.map(s => (
                                <FormControlLabel key={s.idSucursal} value={String(s.idSucursal)} control={<Radio />} label={s.nombre} />
                              ))}
                            </RadioGroup>
                          </FormControl>
                        </Box>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button variant="outlined" onClick={() => setAddProd(false)}>Cancelar</Button>
              <Button variant="contained" onClick={submitAdd} disabled={addLoading}>{addLoading ? 'CREANDO...' : 'CREAR'}</Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}

      {/* Stock por sucursal */}
  {/* productos table arriba (se renderiza más abajo) */}
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      {/* Filtros para la tabla */}
      <div className="productos-filtros-container mb-3">
        <div className="card">
          <div className="card-body">
            <h6 className="card-title mb-3">
              <i className="bi bi-funnel me-2"></i>
              Filtros de búsqueda
            </h6>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Buscar por nombre del producto"
                  placeholder="Ej: Bomba, Panel Solar..."
                  value={filtroNombre}
                  onChange={(e) => setFiltroNombre(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start"><i className="bi bi-search" /></InputAdornment>
                    ),
                    endAdornment: filtroNombre ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setFiltroNombre('')}><i className="bi bi-x" /></IconButton>
                      </InputAdornment>
                    ) : null
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Filtrar por sucursal"
                  placeholder="Ej: Centro, Norte, Sur..."
                  value={filtroSucursal}
                  onChange={(e) => setFiltroSucursal(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start"><i className="bi bi-building" /></InputAdornment>
                    ),
                    endAdornment: filtroSucursal ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setFiltroSucursal('')}><i className="bi bi-x" /></IconButton>
                      </InputAdornment>
                    ) : null
                  }}
                />
              </Grid>
            </Grid>
            <div className="mt-2">
              <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                Productos encontrados: <strong>{productosFiltrados.length}</strong> | 
                Registros de stock: <strong>{stockFiltrado.length}</strong>
              </small>
            </div>
          </div>
        </div>
      </div>

      <Box sx={{ mt: 3 }}>
        <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: '0 18px 40px rgba(15,23,42,0.08)', background: 'linear-gradient(180deg,#ffffff,#fbfcfd)' }}>
          <Table stickyHeader className="admin-table" sx={{ background: 'transparent' }}>
            <TableHead>
              <TableRow>
                <TableCell className="tnum num-right nowrap">ID</TableCell>
                <TableCell sx={{ cursor: 'pointer' }} onClick={() => toggleSort('nombre')}>Nombre {sortField === 'nombre' ? (sortOrder === 'desc' ? '▴' : '▾') : ''}</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell className="tnum num-right nowrap" sx={{ cursor: 'pointer' }} onClick={() => toggleSort('precio')}>Precio {sortField === 'precio' ? (sortOrder === 'desc' ? '▴' : '▾') : ''}</TableCell>
                <TableCell className="tnum num-right nowrap" sx={{ cursor: 'pointer' }} onClick={() => toggleSort('stock')}>Stock {sortField === 'stock' ? (sortOrder === 'desc' ? '▴' : '▾') : ''}</TableCell>
                <TableCell>Acciones</TableCell>
                {sucursalesList.map(s => (
                  <TableCell key={s.idSucursal} className="tnum num-center nowrap">{s.nombreSucursal}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {productosFiltradosPaged.map((p, idx) => (
                <TableRow key={p.idProducto} hover sx={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f7f8fa', '&:hover': { background: 'rgba(15,23,42,0.035)' } }}>
                  <TableCell className="tnum num-right nowrap">{p.idProducto}</TableCell>
                  <TableCell>{p.nombre}</TableCell>
                  <TableCell sx={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.descripcion}>{p.descripcion}</TableCell>
                  <TableCell className="tnum num-right nowrap">{formatCurrency(Number(p.precio || p.price || 0))}</TableCell>
                  <TableCell className="tnum num-right nowrap">{p.stock}</TableCell>
                  <TableCell className="nowrap">
                    <Tooltip title="Editar">
                      <IconButton size="small" color="primary" onClick={() => handleEdit(p)} aria-label="Editar">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton size="small" color="error" onClick={() => handleDelete(p)} aria-label="Eliminar">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  {sucursalesList.map(s => {
                    const stockRow = stockSucursal.find(ss => ss.idProducto === p.idProducto && ss.idSucursal === s.idSucursal);
                    return <TableCell key={`${p.idProducto}-${s.idSucursal}`} className="tnum num-center nowrap">{stockRow ? stockRow.stockDisponible : 0}</TableCell>;
                  })}
                </TableRow>
              ))}

              {productosFiltrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6 + sucursalesList.length} align="center">No se encontraron productos que coincidan con los filtros</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">Filas por página</Typography>
            <FormControl size="small">
              <Select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} sx={{ width: 90 }}>
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={8}>8</MenuItem>
                <MenuItem value={12}>12</MenuItem>
                <MenuItem value={20}>20</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button size="small" variant="outlined" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>« Primero</Button>
            <Button size="small" variant="outlined" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>‹</Button>
            <Typography variant="body2">Página {currentPage} de {totalPages}</Typography>
            <Button size="small" variant="outlined" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}>›</Button>
            <Button size="small" variant="outlined" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>Último »</Button>
          </Box>
        </Box>
      </Box>

      {/* Stock por sucursal: grid de dos columnas en pantallas grandes con filtros aplicados */}
      <div className="productos-stock-grid">
        {stockFiltrado && stockFiltrado.length === 0 && (
          <div className="text-muted text-center py-4">
            <i className="bi bi-funnel me-2"></i>
            No hay datos de stock que coincidan con los filtros aplicados
          </div>
        )}
        {stockFiltrado && stockFiltrado.length > 0 && (
          Object.entries(stockFiltrado.reduce((acc, cur) => {
            const key = `${cur.idSucursal}::${cur.nombreSucursal}`;
            acc[key] = acc[key] || [];
            acc[key].push(cur);
            return acc;
          }, {})).map(([key, items]) => {
            const [, nombreSucursal] = key.split('::');
              return (
                <StockTable key={key} items={items} nombreSucursal={nombreSucursal} idSucursal={items[0]?.idSucursal} onEdit={(payload) => setEditSucursal(payload)} />
              );
          })
        )}
      </div>
      {/* Modal Edición - migrado a MUI Dialog */}
      {editProd && (
        <Dialog open={!!editProd} onClose={() => setEditProd(null)} fullWidth maxWidth="md" scroll="paper" PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle>Editar Producto</DialogTitle>
          <Box component="form" onSubmit={submitEdit} noValidate>
            <DialogContent dividers sx={{ maxHeight: '68vh', overflow: 'auto', pt: 2 }}>
              {error && <Box sx={{ bgcolor: '#fff2f2', color: '#dc2626', p: 2, borderRadius: 1, mb: 2 }}>{error}</Box>}
              <Grid container spacing={2} alignItems="flex-start">
                <Grid item xs={12} md={3}>
                  <TextField fullWidth size="small" variant="outlined" name="nombre" label="Nombre del producto *" value={form.nombre} onChange={handleChange} error={!!editFieldErrors.nombre} helperText={editFieldErrors.nombre || ''} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    variant="outlined"
                    multiline
                    minRows={4}
                    maxRows={8}
                    name="descripcion"
                    label="Descripción *"
                    value={form.descripcion}
                    onChange={handleChange}
                    error={!!editFieldErrors.descripcion}
                    helperText={editFieldErrors.descripcion || ''}
                    inputProps={{ style: { maxHeight: 220, overflow: 'auto', padding: '8px' } }}
                  />
                </Grid>
                <Grid item xs={12} md={5}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth size="small" variant="outlined" type="number" name="precio" label="Precio *" value={form.precio} onChange={handleChange} error={!!editFieldErrors.precio} helperText={editFieldErrors.precio || ''} inputProps={{ step: '0.01', min: 0 }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth size="small" variant="outlined" type="number" name="stockTotal" label="Stock *" value={form.stockTotal} onChange={handleChange} error={!!editFieldErrors.stockTotal} helperText={editFieldErrors.stockTotal || ''} inputProps={{ min: 0 }} />
                    </Grid>
                    <Grid item xs={12}>
                      <InputLabel sx={{ mb: 1 }}>Imágenes del producto (máx.5)</InputLabel>
                      <input type="file" accept="image/*" multiple onChange={handleMultipleImagesChange} />
                      <Box sx={{ mt: 1 }}>
                        {imagePreviews.length === 0 && (
                          <Box sx={{ p:1, border: '1px dashed #ccc', borderRadius:2, fontSize:12, color:'#555' }}>
                            No hay imágenes cargadas actualmente. Puedes subir hasta 5.
                          </Box>
                        )}
                        {imagePreviews.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {imagePreviews.map((preview, index) => (
                              <Box key={index} sx={{ position: 'relative' }}>
                                <img
                                  src={typeof preview === 'string' && preview.startsWith('data:')
                                    ? preview
                                    : (typeof preview === 'string'
                                        ? `http://localhost:3000/uploads/${preview}`
                                        : preview)}
                                  alt={`Preview ${index + 1}`}
                                  style={{ width: 100, height: 70, objectFit: 'cover', borderRadius: 8 }}
                                />
                                <IconButton
                                  size="small"
                                  onClick={() => removeImage(index)}
                                  sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff' }}
                                  title="Eliminar esta imagen"
                                >×</IconButton>
                                <Typography variant="caption" display="block" align="center">
                                  Imagen {index + 1}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        )}
                        <Typography variant="caption" sx={{ display:'block', mt:1, color:'#666' }}>
                          {imagePreviews.length} / 5 imágenes actuales (puedes eliminar con la X).
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button variant="outlined" onClick={() => setEditProd(null)}>Cancelar</Button>
              <Button type="submit" variant="contained">Guardar</Button>
            </DialogActions>
          </Box>
        </Dialog>
      )}

      {/* Modal Editar stock por sucursal - migrado a MUI Dialog */}
      {editSucursal && (
        <Dialog open={!!editSucursal} onClose={() => setEditSucursal(null)} fullWidth maxWidth="sm">
          <DialogTitle>Editar Stock por Sucursal</DialogTitle>
          <DialogContent>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>{editSucursal.nombreProducto} (Sucursal {editSucursal.idSucursal})</Typography>
            <TextField fullWidth type="number" label="Stock disponible" value={editSucursal.stockDisponible} onChange={(e) => setEditSucursal({ ...editSucursal, stockDisponible: e.target.value })} inputProps={{ min: 0 }} sx={{ mb: 2 }} />
            <Box sx={{ bgcolor: '#F3F4F6', p: 2, borderRadius: 1, mb: 1, color: '#6b7280' }}>
              <i className="bi bi-info-circle me-1"></i>
              Solo se modifica el stock de este producto en la sucursal seleccionada; el stock total del producto se ajustará automáticamente.
            </Box>
          </DialogContent>
          <DialogActions>
            <Button variant="outlined" onClick={() => setEditSucursal(null)}>Cancelar</Button>
            <Button variant="contained" onClick={async () => {
              try {
                const payload = { stockDisponible: Number(editSucursal.stockDisponible) };
                await api.put(`/admin/stock_sucursal/${editSucursal.idSucursal}/${editSucursal.idProducto}`, payload);
                setSuccess('Stock actualizado correctamente');
                setEditSucursal(null);
                setError(null);
              } catch (err) {
                let msg = 'Error al actualizar stock';
                if (err && err.response && err.response.data && err.response.data.error) msg = err.response.data.error;
                setError(msg);
              }
            }}>Guardar</Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Modal Eliminación - migrado a MUI Dialog */}
      {deleteProd && (
        <Dialog open={!!deleteProd} onClose={() => { setDeleteProd(null); setDeleteError(null); }} fullWidth maxWidth="sm">
          <DialogTitle>Eliminar producto</DialogTitle>
          <DialogContent>
            {deleteError && <Box sx={{ bgcolor: '#fff2f2', color: '#dc2626', p: 2, borderRadius: 1, mb: 2 }}>{deleteError}</Box>}
            <Typography sx={{ color: '#6b7280', mb: 1 }}>¿Estás seguro que quieres eliminar <strong style={{ color: '#374151' }}>{deleteProd.nombre}</strong>? Esta acción no se puede deshacer.</Typography>
          </DialogContent>
          <DialogActions>
            <Button variant="outlined" onClick={() => { setDeleteProd(null); setDeleteError(null); }}>Cancelar</Button>
            <Button color="error" variant="contained" onClick={confirmDelete}>Eliminar</Button>
          </DialogActions>
        </Dialog>
      )}
    {/* Confirmación: actualizar filas/columnas faltantes (Dialog MUI) */}
    {showBackfillModal && (
      <Dialog open={showBackfillModal} onClose={() => setShowBackfillModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Actualizar filas y columnas faltantes</DialogTitle>
        <DialogContent>
          <Typography>Esta acción creará o actualizará las filas y columnas faltantes en el inventario por sucursal para todos los productos. Las filas creadas tendrán stock=0 por defecto. ¿Deseas continuar?</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setShowBackfillModal(false)}>Cancelar</Button>
          <Button variant="contained" onClick={async () => { await runBackfill(); setShowBackfillModal(false); }}>Actualizar</Button>
        </DialogActions>
      </Dialog>
    )}

    {/* Reconcile confirmation modal removed; use Herramientas -> Reconciliar producto */}
    {/* Seleccionar producto para alinear stock por sucursal (desde Herramientas) */}
    {showSelectReconcileModal && (
      <Dialog open={showSelectReconcileModal} onClose={() => { setShowSelectReconcileModal(false); setSelectedProductForReconcile(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>Alinear stock por sucursal (producto)</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1 }}>Selecciona el producto que deseas alinear. Esta acción ajustará los stocks de cada sucursal para que su suma coincida con el stock total del producto.</Typography>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="reconcile-product-label">Producto</InputLabel>
            <Select labelId="reconcile-product-label" label="Producto" value={selectedProductForReconcile ?? ''} onChange={(e) => setSelectedProductForReconcile(Number(e.target.value))}>
              <MenuItem value="" disabled>-- Selecciona --</MenuItem>
              {productos.map(p => (
                <MenuItem key={p.idProducto} value={p.idProducto}>{p.nombre} (ID: {p.idProducto})</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => { setShowSelectReconcileModal(false); setSelectedProductForReconcile(null); }}>Cancelar</Button>
          <Button variant="contained" onClick={async () => {
            if (!selectedProductForReconcile) return setError('Selecciona un producto para alinear');
            try {
              await api.post(`/productos/${selectedProductForReconcile}/reconcile`);
              setSuccess('Alineación ejecutada');
            } catch {
              setError('Error al alinear stock');
            }
            setShowSelectReconcileModal(false);
            setSelectedProductForReconcile(null);
          }}>Alinear</Button>
        </DialogActions>
      </Dialog>
    )}
    </Box>
  );
}

export default Productos;