import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OrdersAdminService } from '../services/OrdersAdminService';
import { Box, Typography, Paper, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Divider } from '@mui/material';
import { formatCurrency } from '../utils/format';

export default function PedidoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const service = new OrdersAdminService();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await service.getById(id);
        if (!mounted) return;
        setPedido(data);
      } catch (e) {
        console.error('Error cargando pedido', e);
        setError('No se pudo cargar el pedido');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (id) load();
    return () => { mounted = false; };
  }, [id]);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
      <CircularProgress />
    </Box>
  );

  if (error) return (
    <Box sx={{ p: 3 }}>
      <Typography color="error">{error}</Typography>
      <Button sx={{ mt: 2 }} variant="outlined" onClick={() => navigate(-1)}>Volver</Button>
    </Box>
  );

  if (!pedido) return (
    <Box sx={{ p: 3 }}>
      <Typography>No se encontró el pedido.</Typography>
      <Button sx={{ mt: 2 }} variant="outlined" onClick={() => navigate(-1)}>Volver</Button>
    </Box>
  );

  const { productos = [], idPedido, nombreUsuario, apellidoUsuario, fecha, metodoPago, estado, totalConInteres, observaciones } = pedido;

  const retiro = pedido.retiro || null;

  return (
    <Box sx={{ width: '100%', p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Pedido #{idPedido}</Typography>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>{nombreUsuario} {apellidoUsuario}</Typography>
        </Box>
        <Box>
          <Button variant="outlined" onClick={() => navigate(-1)}>Volver</Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Detalle</Typography>
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Fecha</Typography>
            <Typography>{fecha ? new Date(fecha).toLocaleString('es-AR') : '-'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Estado</Typography>
            <Typography>{estado || '-'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Forma de pago</Typography>
            <Typography>{metodoPago || '-'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Total</Typography>
            <Typography sx={{ fontWeight: 700 }}>{formatCurrency(Number(totalConInteres || pedido.total || 0))}</Typography>
          </Box>
        </Box>
        {observaciones ? (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Observaciones</Typography>
            <Typography>{observaciones}</Typography>
          </Box>
        ) : null}

        {retiro ? (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Retiro</Typography>
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Código de retiro</Typography>
                <Typography sx={{ fontWeight: 700 }}>{retiro.codigo}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Teléfono</Typography>
                <Typography>{retiro.telefono || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Creado</Typography>
                <Typography>{retiro.createdAt ? new Date(retiro.createdAt).toLocaleString('es-AR') : '-'}</Typography>
              </Box>
            </Box>
          </Paper>
        ) : null}
      </Paper>

      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Productos</Typography>
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Producto</TableCell>
              <TableCell align="right">Cantidad</TableCell>
              <TableCell align="right">Precio unit.</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {productos.map((p, i) => (
              <TableRow key={i}>
                <TableCell sx={{ maxWidth: 420 }}>{p.nombre}</TableCell>
                <TableCell align="right">{p.cantidad}</TableCell>
                <TableCell align="right">{formatCurrency(Number(p.precioUnitario || p.precio || 0))}</TableCell>
                <TableCell align="right">{formatCurrency(Number((p.cantidad || 0) * (p.precioUnitario || p.precio || 0)))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
