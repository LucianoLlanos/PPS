import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import ProductModal from './ProductModal';
import cart from '../utils/cart';
import { useLocation } from 'react-router-dom';

export default function HomeProducts() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 12;
  const [selected, setSelected] = useState(null);
  const [showExamples, setShowExamples] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      let res;
      try {
        res = await api.get('/productos');
        console.debug('[HomeProducts] /productos response:', res && res.data);
        setProductos(res.data || []);
      } catch (err) {
        console.warn('[HomeProducts] /productos failed, falling back to /seller/products', err && err.response ? err.response.status : err.message);
        // fallback
        res = await api.get('/seller/products');
        console.debug('[HomeProducts] /seller/products response:', res && res.data);
        const normalized = (res.data || []).map(p => ({
          idProducto: p.id || p.idProducto,
          nombre: p.name || p.nombre,
          descripcion: p.description || p.descripcion,
          precio: p.price || p.precio,
          stock: p.stock || p.stockTotal,
          imagen: p.image || p.imagen,
        }));
        setProductos(normalized);
      }
    } catch (err) {
      console.error('Error fetching productos', err);
      setError('No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    setQuery(q);
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const filtered = productos.filter(p => {
    const text = (p.nombre || p.name || '').toString().toLowerCase() + ' ' + (p.descripcion || p.description || '').toString().toLowerCase();
    return text.includes(query.toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const visible = filtered.slice((page-1)*perPage, page*perPage);

  const exampleProducts = [
    { idProducto: 'e1', nombre: 'Ejemplo: Bomba 1HP', descripcion: 'Tarjeta de ejemplo - Bomba', precio: 45000, imagen: null },
    { idProducto: 'e2', nombre: 'Ejemplo: Panel Solar', descripcion: 'Tarjeta de ejemplo - Panel', precio: 85000, imagen: null },
    { idProducto: 'e3', nombre: 'Ejemplo: Tanque 1000L', descripcion: 'Tarjeta de ejemplo - Tanque', precio: 60000, imagen: null },
  ];

  const itemsToRender = showExamples ? exampleProducts : visible;

  const add = (p) => { cart.addToCart(p, 1); };

  const sampleProducts = [
    { idProducto: 's1', nombre: 'Ejemplo A', descripcion: 'Producto de ejemplo A', precio: 1000 },
    { idProducto: 's2', nombre: 'Ejemplo B', descripcion: 'Producto de ejemplo B', precio: 2000 },
    { idProducto: 's3', nombre: 'Ejemplo C', descripcion: 'Producto de ejemplo C', precio: 3000 },
  ];

  const loadExamples = () => { setProductos(sampleProducts); };

  if (loading) return <div style={{padding:20}}>Cargando productos...</div>;
  if (error) return <div style={{padding:20}} className="alert alert-danger">{error}</div>;

  return (
    <div style={{padding:20}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14}}>
        <h2 style={{margin:0}}>Catálogo de productos</h2>
        <div>
          <input placeholder="Buscar..." value={query} onChange={(e)=>{setQuery(e.target.value); setPage(1);}} style={{padding:6, minWidth:220}} />
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16}}>
        {itemsToRender.map(p => (
          <div key={p.idProducto || p.id} className="card" style={{padding:12, border: '1px solid #e9ecef', borderRadius:8, display:'flex', flexDirection:'column'}}>
            <div style={{height:160, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', marginBottom:8}}>
              {(() => {
                // Para pruebas: usar la misma imagen para todas las tarjetas
                const src = '/img/descarga.jpg';
                return <img src={src} alt={p.nombre || p.name} style={{maxWidth: '100%', maxHeight: '100%', objectFit:'contain'}} />;
              })()}
            </div>
            <h5 style={{margin:0, marginBottom:6}}>{p.nombre}</h5>
            <div style={{color:'#666', fontSize:14, marginBottom:8, minHeight:40}}>
              {(p.descripcion || '').length > 120 ? ((p.descripcion || '').slice(0,120) + '...') : (p.descripcion || '')}
            </div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'auto'}}>
              <div style={{fontWeight:700}}>${Number(p.precio || 0).toFixed(2)}</div>
              <div>
                <button className="btn btn-sm btn-outline-primary" onClick={() => setSelected(p)} style={{marginRight:8}}>Ver</button>
                <button className="btn btn-sm btn-primary" onClick={() => add(p)}>Agregar</button>
              </div>
            </div>
          </div>
        ))}

        {itemsToRender.length === 0 && (
          <div style={{gridColumn: '1 / -1', color:'#666'}}>No hay productos para mostrar</div>
        )}
      </div>

      <div style={{marginTop:12, display:'flex', justifyContent:'center'}}>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowExamples(s => !s)}>
          {showExamples ? 'Mostrar reales' : 'Mostrar ejemplos'}
        </button>
      </div>

      {/* Paginación simple */}
      <div style={{marginTop:16, display:'flex', justifyContent:'center', gap:8}}>
        <button disabled={page<=1} onClick={()=>setPage(page-1)}>Anterior</button>
        <div style={{padding:'6px 10px'}}>Página {page} / {totalPages}</div>
        <button disabled={page>=totalPages} onClick={()=>setPage(page+1)}>Siguiente</button>
      </div>

      {selected && <ProductModal product={selected} onClose={()=>setSelected(null)} onAdded={()=>{}} />}
    </div>
  );
}
