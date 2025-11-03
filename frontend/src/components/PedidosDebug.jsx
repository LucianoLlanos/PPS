// Test component para debug de totales
import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { formatCurrency } from '../utils/format';
import { Box, Typography, Paper, Button } from '@mui/material';

function PedidosDebug() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawData, setRawData] = useState(null);

  const loadPedidos = async () => {
    try {
      setLoading(true);
      console.log('Cargando pedidos desde API...');
      
      const response = await api.get('/pedidos');
      console.log('Response status:', response.status);
      console.log('Response data (raw):', response.data);
      
      setRawData(JSON.stringify(response.data, null, 2));
      setPedidos(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (err) {
      console.error('Error loading pedidos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPedidos();
  }, []);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  // Filtrar pedidos 75 y 76 para debug
  const pedido75 = pedidos.find(p => p.idPedido === 75);
  const pedido76 = pedidos.find(p => p.idPedido === 76);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Debug de Totales - Pedidos</Typography>
      
      <Button variant="contained" onClick={loadPedidos} sx={{ mb: 2 }}>
        Recargar datos
      </Button>

      {/* Debug de pedidos específicos */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Pedidos 75 y 76 - Debug</Typography>
        
        {pedido75 ? (
          <Box sx={{ mb: 2, p: 1, border: '1px solid green' }}>
            <Typography><strong>Pedido 75:</strong></Typography>
            <Typography>• total (raw): {JSON.stringify(pedido75.total)}</Typography>
            <Typography>• total (typeof): {typeof pedido75.total}</Typography>
            <Typography>• Number(total): {Number(pedido75.total)}</Typography>
            <Typography>• formatCurrency: {formatCurrency(Number(pedido75.total || 0))}</Typography>
            <Typography>• productos: {pedido75.productos?.length || 0}</Typography>
          </Box>
        ) : (
          <Box sx={{ p: 1, border: '1px solid red' }}>
            <Typography color="error">❌ Pedido 75 NO encontrado</Typography>
          </Box>
        )}

        {pedido76 ? (
          <Box sx={{ mb: 2, p: 1, border: '1px solid green' }}>
            <Typography><strong>Pedido 76:</strong></Typography>
            <Typography>• total (raw): {JSON.stringify(pedido76.total)}</Typography>
            <Typography>• total (typeof): {typeof pedido76.total}</Typography>
            <Typography>• Number(total): {Number(pedido76.total)}</Typography>
            <Typography>• formatCurrency: {formatCurrency(Number(pedido76.total || 0))}</Typography>
            <Typography>• productos: {pedido76.productos?.length || 0}</Typography>
          </Box>
        ) : (
          <Box sx={{ p: 1, border: '1px solid red' }}>
            <Typography color="error">❌ Pedido 76 NO encontrado</Typography>
          </Box>
        )}
      </Paper>

      {/* Listado de todos los pedidos */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Todos los pedidos ({pedidos.length})</Typography>
        {pedidos.slice(0, 10).map(p => (
          <Box key={p.idPedido} sx={{ mb: 1, p: 1, border: '1px solid #ccc' }}>
            <Typography>
              <strong>ID {p.idPedido}</strong> - 
              Total: {JSON.stringify(p.total)} ({typeof p.total}) - 
              Formatted: {formatCurrency(Number(p.total || 0))} - 
              Usuario: {p.nombreUsuario}
            </Typography>
          </Box>
        ))}
      </Paper>

      {/* Raw data */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Raw API Response</Typography>
        <pre style={{ fontSize: '12px', overflow: 'auto', maxHeight: '300px' }}>
          {rawData}
        </pre>
      </Paper>
    </Box>
  );
}

export default PedidosDebug;