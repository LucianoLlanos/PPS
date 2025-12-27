import React, { useEffect, useState, useMemo } from 'react';
import { ProductsService } from '../services/ProductsService';
import { StockService } from '../services/StockService';
import { SucursalesService } from '../services/SucursalesService';
import '../stylos/admin/Admin.css';
import '../stylos/admin/Productos.css';
import { Box, Typography, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button, Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, IconButton, RadioGroup, FormControlLabel, Radio, InputAdornment, Tooltip, Autocomplete } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import HistoryIcon from '@mui/icons-material/History';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AddIcon from '@mui/icons-material/Add';
import { formatCurrency } from '../utils/format';
// Exportación (PDF / Excel)
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Memoized StockTable to avoid re-rendering stock tables on every parent render
const StockTable = React.memo(function StockTable({ items, nombreSucursal, idSucursal, onEdit }) {
  const [page, setPage] = useState(1);
  const [pageSizeLocal, setPageSizeLocal] = useState(6);
  const keyField = idSucursal ? `productos:stock:${idSucursal}:sortField` : null;
  const keyOrder = idSucursal ? `productos:stock:${idSucursal}:sortOrder` : null;
  const [sortFieldLocal, setSortFieldLocal] = useState(() => {
    try { return keyField ? sessionStorage.getItem(keyField) : null; } catch { return null; }
  });
  const [sortOrderLocal, setSortOrderLocal] = useState(() => {
    try { return keyOrder ? sessionStorage.getItem(keyOrder) || 'asc' : 'asc'; } catch { return 'asc'; }
  });

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
    } catch {}
  }, [keyField, keyOrder, sortFieldLocal, sortOrderLocal]);

  const sorted = useMemo(() => {
    const arr = [...items];
    if (!sortFieldLocal) return arr;
    arr.sort((a,b) => {
      const fa = a[sortFieldLocal];
      const fb = b[sortFieldLocal];
      const na = Number(fa);
      const nb = Number(fb);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return sortOrderLocal === 'asc' ? na - nb : nb - na;
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
});

function Productos() {
  const productsService = useMemo(() => new ProductsService(), []);
  const stockService = useMemo(() => new StockService(), []);
  const sucursalesService = useMemo(() => new SucursalesService(), []);
  const [productos, setProductos] = useState([]);
  const [stockSucursal, setStockSucursal] = useState([]);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [editFieldErrors, setEditFieldErrors] = useState({});
  const [deleteError, setDeleteError] = useState(null);
  const [editProd, setEditProd] = useState(null);
  const [deleteProd, setDeleteProd] = useState(null);
  const [form, setForm] = useState({ nombre: '', tipo: '', descripcion: '', precio: '' });
  const [success, setSuccess] = useState(null);
  const [addProd, setAddProd] = useState(false);
  const [addForm, setAddForm] = useState({ nombre: '', tipo: '', descripcion: '', precio: '' });
  const [addLoading, setAddLoading] = useState(false);
  // single image legacy removed (usamos multiple images)
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imagesToRemove, setImagesToRemove] = useState([]);
  const [editSucursal, setEditSucursal] = useState(null); // { idSucursal, idProducto, nombreProducto, stockDisponible }
  const [sucursales, setSucursales] = useState([]);
  const [addStockPorSucursal, setAddStockPorSucursal] = useState({});
  const [editStockPorSucursal, setEditStockPorSucursal] = useState({});
  // Asignación exclusiva: 'ALL' para todas o idSucursal específico
  const [sucursalAssignment, setSucursalAssignment] = useState('ALL');
  // Modal para ver descripción completa
  const [viewDescProd, setViewDescProd] = useState(null);
  const [movimientosOpen, setMovimientosOpen] = useState(false);
  const [movimientosList, setMovimientosList] = useState([]);
  const [movimientosLoading, setMovimientosLoading] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferProduct, setTransferProduct] = useState(null);
  const [transferFrom, setTransferFrom] = useState(null);
  const [transferTo, setTransferTo] = useState(null);
  const [transferCantidad, setTransferCantidad] = useState('');
  const [transferNota, setTransferNota] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState(null);
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
    const anyOpen = addProd || editProd || deleteProd || editSucursal;
    if (!anyOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (addProd) setAddProd(false);
        if (editProd) setEditProd(null);
        if (deleteProd) setDeleteProd(null);
        if (editSucursal) setEditSucursal(null);
      }
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous || '';
      document.removeEventListener('keydown', onKey);
    };
  }, [addProd, editProd, deleteProd, editSucursal]);

  

  useEffect(() => {
    productsService.listAdmin()
      .then(setProductos)
      .catch(() => setError('Error al obtener productos'));
    stockService.listStockSucursal()
      .then(setStockSucursal)
      .catch(() => {});
    sucursalesService.list()
      .then(setSucursales)
      .catch(() => {});
  }, [productsService, stockService, sucursalesService, success]);

  // Escuchar eventos globales de refresco de productos/stock (p.ej. después de un pedido)
  useEffect(() => {
    const onRefresh = (e) => {
      // Re-fetch stock rows and admin product list
      stockService.listStockSucursal().then(setStockSucursal).catch(() => {});
      productsService.listAdmin().then(setProductos).catch(() => {});
    };
    window.addEventListener('products:refresh', onRefresh);
    return () => window.removeEventListener('products:refresh', onRefresh);
  }, [stockService, productsService]);

  // Inicializar map de stock por sucursal para el formulario de agregar
  useEffect(() => {
    if (!sucursales || sucursales.length === 0) return;
    setAddStockPorSucursal(prev => {
      const map = {};
      sucursales.forEach(s => {
        map[s.idSucursal] = typeof prev[s.idSucursal] !== 'undefined' ? prev[s.idSucursal] : 0;
      });
      return map;
    });
  }, [sucursales]);

  const handleEdit = (prod) => {
    setEditProd(prod);
    setForm({ nombre: prod.nombre, tipo: prod.tipo || '', descripcion: prod.descripcion, precio: prod.precio });
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
      productsService.listPublic().then(list => {
        if (Array.isArray(list)) {
          const full = list.find(p => Number(p.idProducto) === Number(prod.idProducto));
          if (full && Array.isArray(full.imagenes) && full.imagenes.length > 0) {
            console.log('[DEBUG handleEdit] Imagenes desde /productos:', full.imagenes);
            setImagePreviews(prev => {
              const hadOnlyLegacy = prev.length <= 1;
              return hadOnlyLegacy ? [...full.imagenes] : prev;
            });
          }
          // actualizar tipo si viene en datos públicos
          if (full && full.tipo) {
            setForm(f => ({ ...f, tipo: full.tipo }));
          }
        }
      }).catch(() => {});
    } catch {}

    // initialize editStockPorSucursal from current stockSucursal rows
    try {
      const map = {};
      if (sucursales && sucursales.length > 0) {
        sucursales.forEach(s => { map[s.idSucursal] = 0; });
      }
      stockSucursal.forEach(ss => {
        if (Number(ss.idProducto) === Number(prod.idProducto)) map[ss.idSucursal] = Number(ss.stockDisponible || 0);
      });
      setEditStockPorSucursal(map);
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
    // note: stockTotal is managed per-sucursal; do not validate here
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
    setEditFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    // Enviar como multipart/form-data si hay imágenes nuevas O si se eliminaron imágenes existentes
    // (antes sólo se enviaba FormData cuando había nuevas imágenes, impidiendo borrar sin añadir)
    if ((selectedImages && selectedImages.length > 0) || (imagesToRemove && imagesToRemove.length > 0)) {
      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('descripcion', descripcion);
      if (form.tipo) formData.append('tipo', form.tipo);
      formData.append('precio', Number(form.precio));
      formData.append('stockPorSucursal', JSON.stringify(editStockPorSucursal || {}));
      // anexar imágenes nuevas
      for (const img of selectedImages) formData.append('imagenes', img);
      // anexar lista de imágenes a eliminar (si aplica)
      if (imagesToRemove && imagesToRemove.length > 0) {
        formData.append('removeImages', JSON.stringify(imagesToRemove));
      }
      productsService.updateAdmin(editProd.idProducto, formData, true)
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
      productsService.updateAdmin(editProd.idProducto, { ...form, nombre, descripcion, stockPorSucursal: editStockPorSucursal || {} })
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
      await productsService.deleteAdmin(deleteProd.idProducto);
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
    const tipo = addForm.tipo.trim();
    const descripcion = addForm.descripcion.trim();
    if (!nombre) errors.nombre = 'El nombre es obligatorio';
    if (!descripcion) errors.descripcion = 'La descripción es obligatoria';
    if (!addForm.precio || isNaN(addForm.precio) || Number(addForm.precio) <= 0) errors.precio = 'El precio debe ser mayor a 0';
    if (tipo.length > 100) errors.tipo = 'Máximo 100 caracteres';
    // ahora gestionamos stock por sucursal, no validar stockTotal aquí
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setAddLoading(false);
      return;
    }
    
    // Construir stockPorSucursal a partir del formulario de agregar
    const stockPorSucursal = { ...addStockPorSucursal };
    // Construir lista de sucursales a incluir (enviamos todas las claves del mapa)
    const sucursalesIds = Object.keys(stockPorSucursal).map(k => Number(k));

    // Crear FormData para enviar archivo
    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('descripcion', descripcion);
    formData.append('precio', Number(addForm.precio));
    if (tipo) formData.append('tipo', tipo);
    formData.append('stockPorSucursal', JSON.stringify(stockPorSucursal));
    formData.append('sucursales', JSON.stringify(sucursalesIds));
    
    // Agregar múltiples imágenes si fueron seleccionadas
    if (selectedImages.length > 0) {
      for (const img of selectedImages) formData.append('imagenes', img);
    }
    
    try {
      await productsService.createAdmin(formData);
      setSuccess('Producto creado correctamente');
      setAddProd(false);
      setAddForm({ nombre: '', tipo: '', descripcion: '', precio: '' });
      // reset stock por sucursal a ceros
      const zeroMap = {};
      sucursales.forEach(s => { zeroMap[s.idSucursal] = 0; });
      setAddStockPorSucursal(zeroMap);
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


  // preparar lista de sucursales única para columnas
  const sucursalesList = stockSucursal.reduce((acc, cur) => {
    if (!acc.find(s => s.idSucursal === cur.idSucursal)) acc.push({ idSucursal: cur.idSucursal, nombreSucursal: cur.nombreSucursal });
    return acc;
  }, []);

  // Opciones de tipo/categoría basadas en los productos existentes (para Autocomplete)
  const tipoOptions = useMemo(() => {
    try {
      const s = new Set();
      productos.forEach(p => { if (p.tipo) s.add(p.tipo); });
      return Array.from(s);
    } catch {
      return [];
    }
  }, [productos]);

  // Función para filtrar productos (memoizada)
  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      const nombreMatch = p.nombre.toLowerCase().includes(filtroNombre.toLowerCase());
      return nombreMatch;
    });
  }, [productos, filtroNombre]);

  // Filtrar stock por sucursal memoizado: usar los productos filtrados por nombre (por id) y filtrar por nombre de sucursal
  const stockFiltrado = useMemo(() => {
    const filteredProductIds = new Set(productosFiltrados.map(p => p.idProducto));
    return stockSucursal.filter(s => {
      const productMatch = filteredProductIds.size === 0 ? true : filteredProductIds.has(s.idProducto);
      const sucursalMatch = filtroSucursal === '' || s.nombreSucursal.toLowerCase().includes(filtroSucursal.toLowerCase());
      return productMatch && sucursalMatch;
    });
  }, [stockSucursal, productosFiltrados, filtroSucursal]);

  // Agrupar stock por sucursal memoizado para pasar las mismas referencias a StockTable
  const stockGrouped = useMemo(() => {
    return stockFiltrado.reduce((acc, cur) => {
      const key = `${cur.idSucursal}::${cur.nombreSucursal}`;
      acc[key] = acc[key] || [];
      acc[key].push(cur);
      return acc;
    }, {});
  }, [stockFiltrado]);

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

  // NOTE: se usa el componente memoizado `StockTable` definido fuera del componente Productos

  // =============================
  // Exportar Inventario (PDF/Excel)
  // =============================
  const buildExportRows = () => {
    // Usar todos los productos filtrados (ignorar paginación para exportar vista completa)
    return productosFiltradosSorted.map(p => {
      // Mapear stock por sucursal
      const rowStock = {};
      sucursalesList.forEach(s => { rowStock[s.nombreSucursal] = 0; });
      stockSucursal.forEach(ss => {
        if (Number(ss.idProducto) === Number(p.idProducto)) {
          const suc = sucursalesList.find(s => s.idSucursal === ss.idSucursal);
          if (suc) rowStock[suc.nombreSucursal] = Number(ss.stockDisponible || 0);
        }
      });
      return {
        ID: p.idProducto,
        Nombre: p.nombre,
        Descripcion: p.descripcion || '',
        Precio: Number(p.precio || p.price || 0),
        StockTotal: Number(p.stock || 0),
        ...rowStock
      };
    });
  };

  const exportInventarioPDF = () => {
    const rows = buildExportRows();
    if (!rows || rows.length === 0) {
      alert('No hay productos para exportar');
      return;
    }
    const doc = new jsPDF({ orientation: 'landscape' });
    const fecha = new Date().toLocaleString();
    doc.setFontSize(14);
    doc.text('Inventario de Productos', 14, 16);
    doc.setFontSize(9);
    doc.text(`Generado: ${fecha}`, 14, 22);
    const head = [
      [
        'ID',
        'Nombre',
        'Descripción',
        'Precio',
        'Stock Total',
        ...sucursalesList.map(s => `Stock ${s.nombreSucursal}`)
      ]
    ];
    const body = rows.map(r => [
      r.ID,
      r.Nombre,
      (r.Descripcion || '').length > 70 ? (r.Descripcion.substring(0, 67) + '…') : r.Descripcion || '',
      formatCurrency(r.Precio),
      r.StockTotal,
      ...sucursalesList.map(s => r[s.nombreSucursal] ?? 0)
    ]);
    autoTable(doc, {
      head,
      body,
      startY: 26,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42] }
    });
    // Totales al final
    const totalGlobal = rows.reduce((acc, r) => acc + Number(r.StockTotal || 0), 0);
    doc.setFontSize(10);
    doc.text(`Total global de unidades: ${totalGlobal}`, 14, doc.lastAutoTable.finalY + 8);
    doc.save(`inventario_productos_${new Date().toISOString().substring(0,10)}.pdf`);
  };

  const exportInventarioExcel = () => {
    const rows = buildExportRows();
    if (!rows || rows.length === 0) {
      alert('No hay productos para exportar');
      return;
    }
    // Preparar hoja
    const worksheetData = [];
    worksheetData.push([
      'ID', 'Nombre', 'Descripción', 'Precio', 'Stock Total', ...sucursalesList.map(s => `Stock ${s.nombreSucursal}`)
    ]);
    rows.forEach(r => {
      worksheetData.push([
        r.ID,
        r.Nombre,
        r.Descripcion || '',
        Number(r.Precio || 0),
        r.StockTotal,
        ...sucursalesList.map(s => r[s.nombreSucursal] ?? 0)
      ]);
    });
    // Crear workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    // Ajuste simple de anchos
    const colWidths = worksheetData[0].map(h => ({ wch: Math.min(30, Math.max(10, String(h).length + 2)) }));
    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    XLSX.writeFile(wb, `inventario_productos_${new Date().toISOString().substring(0,10)}.xlsx`);
  };

  return (
    <>
    <Box sx={{ width: '100%', py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, system-ui' }}>Productos</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          
          <Button
            variant="outlined"
            color="primary"
            onClick={exportInventarioPDF}
            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600, px: 2.5, py: 0.7 }}
          >Exportar PDF</Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={exportInventarioExcel}
            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600, px: 2.5, py: 0.7 }}
          >Exportar Excel</Button>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            color="success"
            onClick={() => setAddProd(true)}
            sx={{
              borderRadius: 999,
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              py: 0.78,
              boxShadow: '0 8px 18px rgba(16,185,129,0.16)',
              '&:hover': { boxShadow: '0 10px 22px rgba(16,185,129,0.22)' }
            }}
          >
            Agregar producto
          </Button>
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
            <DialogTitle className="productos-inline-modal-title">Agregar Producto</DialogTitle>
            <DialogContent className="productos-inline-modal-content" dividers sx={{ maxHeight: '68vh', overflow: 'auto', pt: 2 }}>
              {error && <Box sx={{ bgcolor: '#fff2f2', color: '#dc2626', p: 2, borderRadius: 1, mb: 2 }}>{error}</Box>}
              <Box component="form" onSubmit={submitAdd} noValidate sx={{ mt: 1 }}>
                <div className="productos-form-row">
                  <div className="productos-form-inner">
                    <TextField fullWidth size="small" variant="outlined" name="nombre" label="Nombre del producto *" value={addForm.nombre} onChange={handleAddChange} error={!!fieldErrors.nombre} helperText={fieldErrors.nombre || ''} />

                    <Autocomplete
                      freeSolo
                      options={tipoOptions}
                      value={addForm.tipo}
                      onChange={(e, v) => setAddForm(prev => ({ ...prev, tipo: v || '' }))}
                      onInputChange={(e, v) => setAddForm(prev => ({ ...prev, tipo: v || '' }))}
                      renderInput={(params) => (
                        <TextField {...params} fullWidth size="small" variant="outlined" name="tipo" label="Tipo / Categoría" sx={{ mt: 2 }} error={!!fieldErrors.tipo} helperText={fieldErrors.tipo || 'Opcional. Usado para filtrado público.'} />
                      )}
                    />

                    <div className="two-cols" style={{ marginTop: 12 }}>
                      <TextField size="small" variant="outlined" type="number" name="precio" label="Precio *" value={addForm.precio} onChange={handleAddChange} error={!!fieldErrors.precio} helperText={fieldErrors.precio || ''} inputProps={{ step: '0.01', min: 0 }} />
                      {/* Eliminado campo global 'Stock' en favor de stock por sucursal */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: '#6b7280' }}>Stock por sucursal abajo</Typography>
                      </Box>
                    </div>

                    <TextField
                      fullWidth
                      size="small"
                      variant="outlined"
                      multiline
                      minRows={2}
                      name="descripcion"
                      label="Descripción *"
                      value={addForm.descripcion}
                      onChange={handleAddChange}
                      error={!!fieldErrors.descripcion}
                      helperText={fieldErrors.descripcion || ''}
                      sx={{ mt: 2 }}
                    />

                    <InputLabel sx={{ mb: 1, display: 'block', marginTop: 2 }}>Imágenes del producto (máx.5)</InputLabel>
                    <input type="file" accept="image/*" multiple onChange={handleMultipleImagesChange} />
                    {imagePreviews.length > 0 && (
                      <Box className="image-previews">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="preview-item">
                            <div className="preview-wrap">
                              <img src={typeof preview === 'string' && preview.startsWith('data:') ? preview : (typeof preview === 'string' ? `http://localhost:3000/uploads/${preview}` : preview)} alt={`Preview ${index+1}`} />
                              <IconButton size="small" className="remove-btn" onClick={() => removeImage(index)}>×</IconButton>
                            </div>
                            <Typography variant="caption" display="block" align="center">Imagen {index+1}</Typography>
                          </div>
                        ))}
                      </Box>
                    )}

                    <div style={{ marginTop: 12 }}>
                      <InputLabel sx={{ display: 'block', mb: 1 }}>Stock por sucursal</InputLabel>
                      <Grid container spacing={2}>
                        {sucursales.map(s => (
                          <Grid item xs={12} sm={6} md={4} key={s.idSucursal}>
                            <TextField
                              size="small"
                              fullWidth
                              type="number"
                              label={s.nombre}
                              value={typeof addStockPorSucursal[s.idSucursal] !== 'undefined' ? addStockPorSucursal[s.idSucursal] : 0}
                              onChange={(e) => setAddStockPorSucursal(prev => ({ ...prev, [s.idSucursal]: Number(e.target.value || 0) }))}
                              inputProps={{ min: 0 }}
                            />
                          </Grid>
                        ))}
                      </Grid>
                      <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mt: 1 }}>Ingrese la cantidad inicial para cada sucursal (0 para no asignar).</Typography>
                    </div>
                  </div>
                </div>
              </Box>
            </DialogContent>
              <DialogActions className="productos-inline-modal-actions" sx={{ p: 2 }}>
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
          <Table stickyHeader className="admin-table" sx={{ background: 'transparent', '& .MuiTableCell-head': { backgroundColor: '#ffffff', zIndex: 3 } }}>
            <TableHead sx={{ position: 'sticky', top: 0, zIndex: 3 }}>
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
                  <TableCell sx={{ maxWidth: 340 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, maxWidth: 340 }}>
                      <Box sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.descripcion}>{p.descripcion}</Box>
                      {p.descripcion && p.descripcion.length > 40 && (
                        <Tooltip title="Ver completa">
                          <IconButton size="small" onClick={() => setViewDescProd(p)} aria-label="Ver descripción" sx={{ ml: 0.5 }}>
                            <RemoveRedEyeIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell className="tnum num-right nowrap">{formatCurrency(Number(p.precio || p.price || 0))}</TableCell>
                  <TableCell className="tnum num-right nowrap">{p.stock}</TableCell>
                  <TableCell className="nowrap">
                    <Tooltip title="Editar">
                      <IconButton size="small" color="primary" onClick={() => handleEdit(p)} aria-label="Editar">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                      <Tooltip title="Movimientos">
                        <IconButton size="small" color="info" onClick={async () => {
                          setMovimientosLoading(true);
                          try {
                            const rows = await stockService.listMovements(p.idProducto, 200);
                            setMovimientosList(rows || []);
                            setMovimientosOpen(true);
                          } catch (e) {
                            setError('Error al obtener movimientos');
                          } finally { setMovimientosLoading(false); }
                        }} aria-label="Movimientos">
                          <HistoryIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Transferir">
                        <IconButton size="small" color="secondary" onClick={() => {
                          // abrir modal de transferencia
                          setTransferProduct(p);
                          // default from: primera sucursal con stock en stockSucursal
                          const rows = stockSucursal.filter(ss => Number(ss.idProducto) === Number(p.idProducto));
                          const withStock = rows.find(r => Number(r.stockDisponible) > 0);
                          setTransferFrom(withStock ? withStock.idSucursal : (rows[0] ? rows[0].idSucursal : (sucursales[0] ? sucursales[0].idSucursal : null)));
                          // default to: primera sucursal distinta
                          const dest = (sucursales && sucursales.find(s => s.idSucursal !== (withStock ? withStock.idSucursal : (rows[0] ? rows[0].idSucursal : (sucursales[0] ? sucursales[0].idSucursal : null))))) || null;
                          setTransferTo(dest ? dest.idSucursal : null);
                          setTransferCantidad('');
                          setTransferNota('');
                          setTransferError(null);
                          setTransferOpen(true);
                        }} aria-label="Transferir">
                          <SwapHorizIcon fontSize="small" />
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
          Object.entries(stockGrouped).map(([key, items]) => {
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
          <DialogTitle className="productos-inline-modal-title">Editar Producto</DialogTitle>
            <Box component="form" onSubmit={submitEdit} noValidate>
              <DialogContent className="productos-inline-modal-content" dividers sx={{ maxHeight: '68vh', overflow: 'auto', pt: 2 }}>
                {error && <Box sx={{ bgcolor: '#fff2f2', color: '#dc2626', p: 2, borderRadius: 1, mb: 2 }}>{error}</Box>}
                <div className="productos-form-row">
                  <div className="productos-form-inner">
                    <TextField fullWidth size="small" variant="outlined" name="nombre" label="Nombre del producto *" value={form.nombre} onChange={handleChange} error={!!editFieldErrors.nombre} helperText={editFieldErrors.nombre || ''} />

                    <Autocomplete
                      freeSolo
                      options={tipoOptions}
                      value={form.tipo}
                      onChange={(e, v) => setForm(prev => ({ ...prev, tipo: v || '' }))}
                      onInputChange={(e, v) => setForm(prev => ({ ...prev, tipo: v || '' }))}
                      renderInput={(params) => (
                        <TextField {...params} fullWidth size="small" variant="outlined" name="tipo" label="Tipo / Categoría" sx={{ mt: 2 }} error={!!editFieldErrors.tipo} helperText={editFieldErrors.tipo || 'Opcional. Usado para filtrado público.'} />
                      )}
                    />

                    <div className="two-cols" style={{ marginTop: 12 }}>
                      <TextField size="small" variant="outlined" type="number" name="precio" label="Precio *" value={form.precio} onChange={handleChange} error={!!editFieldErrors.precio} helperText={editFieldErrors.precio || ''} inputProps={{ step: '0.01', min: 0 }} />
                      {/* Stock total removed from edit form: use "Stock por sucursal" below */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: '#6b7280' }}>Stock por sucursal abajo</Typography>
                      </Box>
                    </div>

                    <TextField
                      fullWidth
                      size="small"
                      variant="outlined"
                      multiline
                      minRows={2}
                      name="descripcion"
                      label="Descripción *"
                      value={form.descripcion}
                      onChange={handleChange}
                      error={!!editFieldErrors.descripcion}
                      helperText={editFieldErrors.descripcion || ''}
                      sx={{ mt: 2 }}
                    />

                    <InputLabel sx={{ mb: 1, display: 'block', marginTop: 2 }}>Imágenes del producto (máx.5)</InputLabel>
                    <input type="file" accept="image/*" multiple onChange={handleMultipleImagesChange} />
                    <Box sx={{ mt: 1 }}>
                      {imagePreviews.length === 0 && (
                        <Box sx={{ p:1, border: '1px dashed #ccc', borderRadius:2, fontSize:12, color:'#555' }}>
                          No hay imágenes cargadas actualmente. Puedes subir hasta 5.
                        </Box>
                      )}
                      {imagePreviews.length > 0 && (
                        <Box className="image-previews">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="preview-item">
                              <div className="preview-wrap">
                                <img
                                  src={typeof preview === 'string' && preview.startsWith('data:')
                                    ? preview
                                    : (typeof preview === 'string'
                                        ? `http://localhost:3000/uploads/${preview}`
                                        : preview)}
                                  alt={`Preview ${index + 1}`} />
                                <IconButton
                                  size="small"
                                  className="remove-btn"
                                  onClick={() => removeImage(index)}
                                  title="Eliminar esta imagen"
                                >×</IconButton>
                              </div>
                              <Typography variant="caption" display="block" align="center">
                                Imagen {index + 1}
                              </Typography>
                            </div>
                          ))}
                        </Box>
                      )}
                      <Typography variant="caption" sx={{ display:'block', mt:1, color:'#666' }}>
                        {imagePreviews.length} / 5 imágenes actuales (puedes eliminar con la X).
                      </Typography>
                    </Box>
                    <div style={{ marginTop: 12 }}>
                      <InputLabel sx={{ display: 'block', mb: 1 }}>Stock por sucursal</InputLabel>
                      <Grid container spacing={2}>
                        {sucursales.map(s => (
                          <Grid item xs={12} sm={6} md={4} key={s.idSucursal}>
                            <TextField
                              size="small"
                              fullWidth
                              type="number"
                              label={s.nombre}
                              value={typeof editStockPorSucursal[s.idSucursal] !== 'undefined' ? editStockPorSucursal[s.idSucursal] : 0}
                              onChange={(e) => setEditStockPorSucursal(prev => ({ ...prev, [s.idSucursal]: Number(e.target.value || 0) }))}
                              inputProps={{ min: 0 }}
                            />
                          </Grid>
                        ))}
                      </Grid>
                      <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mt: 1 }}>Ajusta el stock por sucursal; el stock total se actualizará automáticamente.</Typography>
                    </div>
                  </div>
                </div>
              </DialogContent>
              <DialogActions className="productos-inline-modal-actions" sx={{ p: 2 }}>
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
            <TextField fullWidth type="number" label="Stock disponible" value={typeof editSucursal.stockDisponible !== 'undefined' ? editSucursal.stockDisponible : ''} onChange={(e) => {
                // Keep numeric-only input; allow empty while editing
                const raw = e.target.value;
                const cleaned = raw === '' ? '' : raw.replace(/[^0-9]/g, '');
                setEditSucursal({ ...editSucursal, stockDisponible: cleaned });
              }} inputProps={{ min: 0 }} sx={{ mb: 2 }} />
            {/* validation message */}
            { (typeof editSucursal.stockDisponible === 'undefined' || editSucursal.stockDisponible === '' || isNaN(Number(editSucursal.stockDisponible)) ) && (
              <Typography variant="caption" sx={{ color: 'error.main', display: 'block', mb: 1 }}>Ingrese una cantidad válida (0 o mayor)</Typography>
            )}
            <Box sx={{ bgcolor: '#F3F4F6', p: 2, borderRadius: 1, mb: 1, color: '#6b7280' }}>
              <i className="bi bi-info-circle me-1"></i>
              Solo se modifica el stock de este producto en la sucursal seleccionada; el stock total del producto se ajustará automáticamente.
            </Box>
          </DialogContent>
          <DialogActions>
            <Button variant="outlined" onClick={() => setEditSucursal(null)}>Cancelar</Button>
            <Button variant="contained" disabled={typeof editSucursal.stockDisponible === 'undefined' || editSucursal.stockDisponible === '' || isNaN(Number(editSucursal.stockDisponible))} onClick={async () => {
              try {
                const nuevo = Number(editSucursal.stockDisponible);
                const confirmar = window.confirm(`Confirmar cambio de stock para ${editSucursal.nombreProducto} en sucursal ${editSucursal.idSucursal} a ${nuevo}?`);
                if (!confirmar) return;
                await stockService.updateStockSucursal(editSucursal.idSucursal, editSucursal.idProducto, nuevo);
                setSuccess('Stock actualizado correctamente');
                // refresh lists
                try { const updated = await stockService.listStockSucursal(); setStockSucursal(updated); } catch {};
                try { const prods = await productsService.listAdmin(); setProductos(prods); } catch {}
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
      

    {/* Reconcile confirmation modal removed; use Herramientas -> Reconciliar producto */}
    {/* Seleccionar producto para alinear stock por sucursal (desde Herramientas) */}
    
    </Box>
    {viewDescProd && (
      <Dialog open={!!viewDescProd} onClose={() => setViewDescProd(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Descripción de {viewDescProd.nombre}</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{viewDescProd.descripcion}</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setViewDescProd(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    )}
        {/* Transferencia modal */}
        <Dialog open={transferOpen} onClose={() => setTransferOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Transferir stock</DialogTitle>
          <DialogContent>
            {!transferProduct && <Typography>Selecciona un producto para transferir.</Typography>}
            {transferProduct && (
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>{transferProduct.nombre} (ID {transferProduct.idProducto})</Typography>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel id="from-sucursal-label">Desde sucursal</InputLabel>
                  <Select labelId="from-sucursal-label" value={transferFrom || ''} label="Desde sucursal" onChange={(e) => setTransferFrom(Number(e.target.value))}>
                    {sucursales.map(s => <MenuItem key={s.idSucursal} value={s.idSucursal}>{s.nombre}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel id="to-sucursal-label">Hacia sucursal</InputLabel>
                  <Select labelId="to-sucursal-label" value={transferTo || ''} label="Hacia sucursal" onChange={(e) => setTransferTo(Number(e.target.value))}>
                    {sucursales.map(s => <MenuItem key={s.idSucursal} value={s.idSucursal}>{s.nombre}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField fullWidth size="small" type="number" label="Cantidad a transferir" value={transferCantidad} onChange={(e) => setTransferCantidad(e.target.value.replace(/[^0-9]/g, ''))} inputProps={{ min: 1 }} sx={{ mb: 2 }} />
                <TextField fullWidth size="small" label="Nota (opcional)" value={transferNota} onChange={(e) => setTransferNota(e.target.value)} sx={{ mb: 1 }} />
                {transferError && <Box sx={{ bgcolor: '#fff2f2', color: '#dc2626', p: 1, borderRadius: 1, mt: 1 }}>{transferError}</Box>}
                <Box sx={{ bgcolor: '#F3F4F6', p: 2, borderRadius: 1, mt: 2 }}>
                  <Typography variant="caption" sx={{ color: '#6b7280' }}>La transferencia moverá la cantidad indicada desde la sucursal origen a la sucursal destino. El stock total del producto no cambiará.</Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button variant="outlined" onClick={() => setTransferOpen(false)}>Cancelar</Button>
            <Button variant="contained" disabled={transferLoading || !transferProduct || !transferFrom || !transferTo || Number(transferCantidad) <= 0 || transferFrom === transferTo} onClick={async () => {
              setTransferError(null);
              if (!transferProduct) return setTransferError('Producto no seleccionado');
              if (!transferFrom || !transferTo) return setTransferError('Seleccione sucursal origen y destino');
              if (transferFrom === transferTo) return setTransferError('Origen y destino deben ser diferentes');
              const cantidadNum = Number(transferCantidad);
              if (!cantidadNum || cantidadNum <= 0) return setTransferError('Cantidad inválida');
              setTransferLoading(true);
              try {
                await stockService.transferStock({ idProducto: Number(transferProduct.idProducto), fromSucursal: Number(transferFrom), toSucursal: Number(transferTo), cantidad: cantidadNum, nota: transferNota || null });
                setTransferOpen(false);
                setTransferProduct(null);
                // refresh lists
                try { const updated = await stockService.listStockSucursal(); setStockSucursal(updated); } catch {};
                try { const prods = await productsService.listAdmin(); setProductos(prods); } catch {}
                setSuccess('Transferencia realizada correctamente');
              } catch (err) {
                let msg = 'Error al realizar transferencia';
                if (err && err.response && err.response.data && err.response.data.error) msg = err.response.data.error;
                setTransferError(msg);
              } finally { setTransferLoading(false); }
            }}>{transferLoading ? 'Procesando...' : 'Transferir'}</Button>
          </DialogActions>
        </Dialog>
      {/* Movimientos modal */}
      <Dialog open={movimientosOpen} onClose={() => setMovimientosOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Movimientos de Stock</DialogTitle>
        <DialogContent>
          {movimientosLoading && <Typography>Buscando movimientos...</Typography>}
          {!movimientosLoading && movimientosList.length === 0 && <Typography>No se encontraron movimientos para este producto.</Typography>}
          {!movimientosLoading && movimientosList.length > 0 && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Desde</TableCell>
                  <TableCell>Hasta</TableCell>
                  <TableCell className="tnum">Cantidad</TableCell>
                  <TableCell>Nota</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movimientosList.map(m => (
                  <TableRow key={m.idMovimiento}>
                    <TableCell>{new Date(m.fecha).toLocaleString()}</TableCell>
                    <TableCell>{m.tipo}</TableCell>
                    <TableCell>{m.fromSucursal || '-'}</TableCell>
                    <TableCell>{m.toSucursal || '-'}</TableCell>
                    <TableCell className="tnum">{m.cantidad}</TableCell>
                    <TableCell>{m.nota || ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setMovimientosOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Productos;