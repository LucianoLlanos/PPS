import { useEffect, useState } from 'react';
import api from '../api/axios';
import '../stylos/admin/Admin.css';

import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Snackbar } from '@mui/material';

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [error, setError] = useState(null);
  const [editCliente, setEditCliente] = useState(null);
  const [form, setForm] = useState({ direccion: '', telefono: '' });
  const [success, setSuccess] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const load = () => {
    api.get('/clientes')
      .then(res => setClientes(res.data))
      .catch(() => setError('Error al obtener clientes'));
  };

  useEffect(() => { load(); }, []);

  const handleEdit = (c) => {
    setEditCliente(c);
    setForm({ direccion: c.direccion || '', telefono: c.telefono || '' });
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/clientes/${editCliente.idCliente}`, { direccion: form.direccion || null, telefono: form.telefono || null });
      setSuccess('Cliente actualizado');
      setOpenSnackbar(true);
      setEditCliente(null);
      load();
    } catch {
      setError('Error al actualizar cliente');
      setOpenSnackbar(true);
    }
  };

  return (
    <Box sx={{ width: '100%', py: 3 }}>
  <Typography variant="h4" sx={{ fontWeight: 600, mb: 3, fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, system-ui' }}>
        Clientes
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setOpenSnackbar(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={() => setOpenSnackbar(false)} severity="success" sx={{ width: '100%' }}>{success}</Alert>
      </Snackbar>}
      <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: '0 18px 40px rgba(15,23,42,0.08)', maxWidth: '100vw', overflowX: 'auto', background: 'linear-gradient(180deg,#ffffff,#fbfcfd)' }}>
        <Table sx={{ minWidth: 700, fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, system-ui', background: 'transparent' }}>
          <TableHead>
            <TableRow sx={{ background: 'linear-gradient(180deg,#ffffff 0%, #f3f6f9 100%)', borderBottom: '2px solid #e5e7eb', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, system-ui' }}>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.97rem', letterSpacing: 0.7, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 2, px: 2, borderTopLeftRadius: 14 }}>ID Cliente</TableCell>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.97rem', letterSpacing: 0.7, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 2, px: 2 }}>Usuario</TableCell>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.97rem', letterSpacing: 0.7, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 2, px: 2 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.97rem', letterSpacing: 0.7, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 2, px: 2 }}>Dirección</TableCell>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.97rem', letterSpacing: 0.7, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 2, px: 2 }}>Teléfono</TableCell>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.97rem', letterSpacing: 0.7, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 2, px: 2, borderTopRightRadius: 14 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clientes.map((c, idx) => (
              <TableRow key={c.idCliente} hover sx={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f7f8fa', transition: 'background 0.2s', '&:hover': { background: 'rgba(15,23,42,0.035)' } }}>
                <TableCell sx={{ py: 1.2, px: 2 }}>{c.idCliente}</TableCell>
                <TableCell sx={{ py: 1.2, px: 2 }}>{c.nombre} {c.apellido}</TableCell>
                <TableCell sx={{ py: 1.2, px: 2 }}>{c.email}</TableCell>
                <TableCell sx={{ py: 1.2, px: 2 }}>{c.direccion || ''}</TableCell>
                <TableCell sx={{ py: 1.2, px: 2 }}>{c.telefono || ''}</TableCell>
                <TableCell sx={{ py: 1.2, px: 2 }}>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{
                      borderRadius: 999,
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 2.5,
                      py: 1,
                      background: 'linear-gradient(180deg,#0a84ff,#0060df)',
                      boxShadow: '0 8px 20px rgba(10,132,255,0.12)',
                      fontSize: '0.97rem',
                      letterSpacing: 0.2,
                      '&:hover': {
                        background: 'linear-gradient(180deg,#0a84ff,#0050b3)',
                        boxShadow: '0 12px 30px rgba(10,132,255,0.16)'
                      }
                    }}
                    onClick={() => handleEdit(c)}
                  >
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!editCliente} onClose={() => setEditCliente(null)} PaperProps={{ sx: { borderRadius: 3, minWidth: 340 } }}>
        <DialogTitle sx={{ fontWeight: 600, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial' }}>Editar Cliente</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={submitEdit} sx={{ mt: 1 }}>
            <TextField
              margin="dense"
              label="Dirección"
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              autoFocus
            />
            <TextField
              margin="dense"
              label="Teléfono"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              sx={{ mt: 2 }}
            />
            <DialogActions sx={{ px: 0, pt: 2 }}>
              <Button onClick={() => setEditCliente(null)} color="secondary" variant="outlined" sx={{ borderRadius: 999, textTransform: 'none' }}>Cancelar</Button>
              <Button type="submit" color="success" variant="contained" sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600 }}>Guardar</Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default Clientes;
