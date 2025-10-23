import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { formatCurrency } from '../utils/format';

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [filterId, setFilterId] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterMinTotal, setFilterMinTotal] = useState('');
  const [filterMaxTotal, setFilterMaxTotal] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [customer, setCustomer] = useState('');
  const [total, setTotal] = useState('');
  const [itemsText, setItemsText] = useState('');

  const fetch = async () => {
    try {
      const res = await api.get('/seller/orders');
      setOrders(res.data);
    } catch {
      // Error silencioso
    }
  };

  const submitNew = async (e) => {
    e && e.preventDefault();
    try {
      let items = [];
      // try parse JSON, otherwise split by comma
      try { items = JSON.parse(itemsText); } catch { items = itemsText ? itemsText.split(',').map(s => s.trim()).filter(Boolean) : []; }
      const payload = { customer_name: customer, items, total: Number(total || 0), status: 'pending' };
      await api.post('/seller/orders', payload);
      setCustomer(''); setTotal(''); setItemsText('');
      fetch();
    } catch (err) {
      alert(err?.response?.data?.error || 'Error al crear pedido');
    }
  };

  useEffect(() => { fetch(); }, []);

  const changeStatus = async (id, status) => {
    try {
      await api.put('/seller/orders/' + id + '/status', { status });
      setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
    } catch (err) {
      // Error silencioso
    }
  };
 

  const clearFilters = () => {
    setFilterId(''); setFilterCustomer(''); setFilterMinTotal(''); setFilterMaxTotal(''); setFilterStatus('');
  };

  const displayed = orders.filter(o => {
    if (filterId && !String(o.id).includes(filterId)) return false;
    if (filterCustomer && !(o.customer_name || '').toLowerCase().includes(filterCustomer.toLowerCase())) return false;
    if (filterStatus && o.status !== filterStatus) return false;
    const totalNum = Number(o.total || 0);
    if (filterMinTotal && !Number.isNaN(Number(filterMinTotal)) && totalNum < Number(filterMinTotal)) return false;
    if (filterMaxTotal && !Number.isNaN(Number(filterMaxTotal)) && totalNum > Number(filterMaxTotal)) return false;
    return true;
  });

  return (
    <div>
      <h3>Pedidos</h3>
      <form onSubmit={submitNew} style={{marginBottom:12}}>
        <input placeholder="Cliente" value={customer} onChange={e=>setCustomer(e.target.value)} required style={{marginRight:6}} />
        <input placeholder="Total" value={total} onChange={e=>setTotal(e.target.value)} style={{marginRight:6, width:100}} />
        <input placeholder="Items (JSON array or comma list)" value={itemsText} onChange={e=>setItemsText(e.target.value)} style={{marginRight:6, width:300}} />
        <button type="submit">Crear pedido</button>
      </form>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
          <tr>
            <th><input placeholder="filtrar id" value={filterId} onChange={e=>setFilterId(e.target.value)} style={{width:80}} /></th>
            <th><input placeholder="filtrar cliente" value={filterCustomer} onChange={e=>setFilterCustomer(e.target.value)} style={{width:180}} /></th>
            <th>
              <input placeholder="min" value={filterMinTotal} onChange={e=>setFilterMinTotal(e.target.value)} style={{width:70, marginRight:6}} />
              <input placeholder="max" value={filterMaxTotal} onChange={e=>setFilterMaxTotal(e.target.value)} style={{width:70}} />
            </th>
            <th>
              <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                <option value="">(todos)</option>
                <option value="pending">pending</option>
                <option value="shipped">shipped</option>
                <option value="delivered">delivered</option>
              </select>
            </th>
            <th><button onClick={clearFilters}>Limpiar</button></th>
          </tr>
        </thead>
        <tbody>
          {displayed.map(o => (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td>{o.customer_name}</td>
              <td>{formatCurrency(Number(o.total || 0))}</td>
              <td>{o.status}</td>
              <td>
                <button onClick={() => changeStatus(o.id, 'pending')}>pendiente</button>
                <button onClick={() => changeStatus(o.id, 'shipped')} style={{ marginLeft: 6 }}>enviado</button>
                <button onClick={() => changeStatus(o.id, 'delivered')} style={{ marginLeft: 6 }}>entregado</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
