
import { useEffect, useState, useMemo } from 'react';
import { UsersAdminService } from '../services/UsersAdminService';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Snackbar, Select, MenuItem, InputLabel, FormControl, IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

function Usuarios() {
  const usersService = useMemo(() => new UsersAdminService(), []);
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState('success'); // 'success' | 'error'
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', idRol: '', direccion: '', telefono: '' });
  const [addUser, setAddUser] = useState(false);
  const [addForm, setAddForm] = useState({ nombre: '', apellido: '', email: '', password: '', idRol: '', direccion: '', telefono: '' });

  const loadUsuarios = () => {
    usersService.list()
      .then(setUsuarios)
      .catch(() => setError('Error al obtener usuarios'));
  };

  useEffect(() => { loadUsuarios(); }, []);

  // Auto-ocultar el banner de error superior después de unos segundos
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000); // 5s
    return () => clearTimeout(t);
  }, [error]);

  const handleEdit = (user) => {
    setEditUser(user);
    setForm({ nombre: user.nombre, apellido: user.apellido, email: user.email, idRol: user.idRol, direccion: user.direccion || '', telefono: user.telefono || '' });
  };

  const handleDelete = (user) => {
    setDeleteUser(user);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleAddChange = (e) => setAddForm({ ...addForm, [e.target.name]: e.target.value });

  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      await usersService.update(editUser.idUsuario, { ...form });
      setSuccess('Usuario actualizado correctamente');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      setEditUser(null);
      loadUsuarios();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Error al actualizar usuario';
      setError(msg);
      setSuccess(null);
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const confirmDelete = async () => {
    try {
      await usersService.remove(deleteUser.idUsuario);
      setSuccess('Usuario eliminado correctamente');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      setDeleteUser(null);
      loadUsuarios();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Error al eliminar usuario';
      setError(msg);
      setSuccess(null);
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      setDeleteUser(null);
    }
  };

  const submitAdd = async (e) => {
    e.preventDefault();
    try {
      await usersService.create({ ...addForm });
      setSuccess('Usuario creado correctamente');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      setAddUser(false);
      setAddForm({ nombre: '', apellido: '', email: '', password: '', idRol: '', direccion: '', telefono: '' });
      loadUsuarios();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Error al crear usuario';
      setError(msg);
      setSuccess(null);
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  return (
    <Box sx={{ width: '100%', py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, system-ui' }}>Usuarios</Typography>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          color="success"
          sx={{
            borderRadius: 999,
            textTransform: 'none',
            fontWeight: 700,
            px: 3,
            py: 0.78,
            boxShadow: '0 8px 18px rgba(16,185,129,0.16)',
            '&:hover': { boxShadow: '0 10px 22px rgba(16,185,129,0.22)' }
          }}
          onClick={() => setAddUser(true)}
        >
          Agregar usuario
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setOpenSnackbar(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarSeverity === 'success' ? (success || 'Operación exitosa') : (error || 'Ocurrió un error')}
        </Alert>
      </Snackbar>
      <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: '0 18px 40px rgba(15,23,42,0.08)', maxWidth: '100%', background: 'linear-gradient(180deg,#ffffff,#fbfcfd)', height: { xs: '76vh', md: '72vh' } }}>
        <Table stickyHeader sx={{ minWidth: 900, fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, system-ui', background: 'transparent', '& .MuiTableCell-head': { backgroundColor: '#ffffff', zIndex: 4 } }}>
          <TableHead sx={{ position: 'sticky', top: 0, zIndex: 4 }}>
            <TableRow sx={{ background: 'linear-gradient(180deg,#ffffff 0%, #f3f6f9 100%)', borderBottom: '2px solid #e5e7eb', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, system-ui', position: 'sticky', top: 0, zIndex: 4 }}>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.97rem', letterSpacing: 0.7, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 2, px: 2, borderTopLeftRadius: 14 }} className="tnum num-right">ID</TableCell>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.97rem', letterSpacing: 0.7, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 2, px: 2 }}>Nombre</TableCell>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.97rem', letterSpacing: 0.7, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 2, px: 2 }}>Apellido</TableCell>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.97rem', letterSpacing: 0.7, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 2, px: 2 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.97rem', letterSpacing: 0.7, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 2, px: 2 }}>Rol</TableCell>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.97rem', letterSpacing: 0.7, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 2, px: 2 }}>Dirección</TableCell>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.97rem', letterSpacing: 0.7, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 2, px: 2 }}>Teléfono</TableCell>
              <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#111827', fontSize: '0.97rem', letterSpacing: 0.7, background: 'none', borderBottom: '1.5px solid #e5e7eb', py: 2, px: 2, borderTopRightRadius: 14 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuarios.map((u, idx) => (
              <TableRow key={u.idUsuario} hover sx={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f7f8fa', transition: 'background 0.2s', '&:hover': { background: 'rgba(15,23,42,0.035)' } }}>
                <TableCell sx={{ py: 1.2, px: 2 }} className="tnum num-right">{u.idUsuario}</TableCell>
                <TableCell sx={{ py: 1.2, px: 2 }}>{u.nombre}</TableCell>
                <TableCell sx={{ py: 1.2, px: 2 }}>{u.apellido}</TableCell>
                <TableCell sx={{ py: 1.2, px: 2 }}>{u.email}</TableCell>
                <TableCell sx={{ py: 1.2, px: 2 }}>{u.nombreRol || u.idRol}</TableCell>
                <TableCell sx={{ py: 1.2, px: 2 }}>{u.direccion || ''}</TableCell>
                <TableCell sx={{ py: 1.2, px: 2 }}>{u.telefono || ''}</TableCell>
                <TableCell sx={{ py: 1.2, px: 2 }} className="nowrap">
                  <Tooltip title="Editar">
                    <IconButton size="small" color="primary" onClick={() => handleEdit(u)} aria-label="Editar">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton size="small" color="error" onClick={() => handleDelete(u)} aria-label="Eliminar">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal Alta */}
      <Dialog open={addUser} onClose={() => setAddUser(false)} PaperProps={{ sx: { borderRadius: 3, minWidth: 340 } }}>
        <DialogTitle sx={{ fontWeight: 600, fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, system-ui' }}>Agregar Usuario</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={submitAdd} sx={{ mt: 1 }}>
            <TextField margin="dense" label="Nombre" name="nombre" value={addForm.nombre} onChange={handleAddChange} fullWidth variant="outlined" autoFocus required />
            <TextField margin="dense" label="Apellido" name="apellido" value={addForm.apellido} onChange={handleAddChange} fullWidth variant="outlined" required />
            <TextField margin="dense" label="Email" name="email" value={addForm.email} onChange={handleAddChange} fullWidth variant="outlined" required />
            <TextField margin="dense" label="Contraseña" name="password" value={addForm.password} onChange={handleAddChange} fullWidth variant="outlined" type="password" required />
            <FormControl fullWidth margin="dense">
              <InputLabel id="rol-label">Rol</InputLabel>
              <Select labelId="rol-label" label="Rol" name="idRol" value={addForm.idRol} onChange={handleAddChange} required>
                <MenuItem value={1}>Cliente</MenuItem>
                <MenuItem value={2}>Vendedor</MenuItem>
                <MenuItem value={3}>Admin</MenuItem>
              </Select>
            </FormControl>
            {addForm.idRol == 1 && (
              <>
                <TextField margin="dense" label="Dirección (opcional)" name="direccion" value={addForm.direccion} onChange={handleAddChange} fullWidth variant="outlined" />
                <TextField margin="dense" label="Teléfono (opcional)" name="telefono" value={addForm.telefono} onChange={handleAddChange} fullWidth variant="outlined" />
              </>
            )}
            <DialogActions sx={{ px: 0, pt: 2 }}>
              <Button onClick={() => setAddUser(false)} color="error" variant="outlined" sx={{ borderRadius: 999, textTransform: 'none', borderColor: 'error.main', color: 'error.main' }}>Cancelar</Button>
              <Button type="submit" color="success" variant="contained" sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600 }}>Crear usuario</Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Modal Edición */}
      <Dialog open={!!editUser} onClose={() => setEditUser(null)} PaperProps={{ sx: { borderRadius: 3, minWidth: 340 } }}>
        <DialogTitle sx={{ fontWeight: 600, fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, system-ui' }}>Editar Usuario</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={submitEdit} sx={{ mt: 1 }}>
            <TextField margin="dense" label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} fullWidth variant="outlined" required />
            <TextField margin="dense" label="Apellido" name="apellido" value={form.apellido} onChange={handleChange} fullWidth variant="outlined" required />
            <TextField margin="dense" label="Email" name="email" value={form.email} onChange={handleChange} fullWidth variant="outlined" required />
            <FormControl fullWidth margin="dense">
              <InputLabel id="rol-edit-label">Rol</InputLabel>
              <Select labelId="rol-edit-label" label="Rol" name="idRol" value={form.idRol} onChange={handleChange} required>
                <MenuItem value={1}>Cliente</MenuItem>
                <MenuItem value={2}>Vendedor</MenuItem>
                <MenuItem value={3}>Admin</MenuItem>
              </Select>
            </FormControl>
            {form.idRol == 1 && (
              <>
                <TextField margin="dense" label="Dirección (opcional)" name="direccion" value={form.direccion || ''} onChange={handleChange} fullWidth variant="outlined" />
                <TextField margin="dense" label="Teléfono (opcional)" name="telefono" value={form.telefono || ''} onChange={handleChange} fullWidth variant="outlined" />
              </>
            )}
            <DialogActions sx={{ px: 0, pt: 2 }}>
              <Button onClick={() => setEditUser(null)} color="error" variant="outlined" sx={{ borderRadius: 999, textTransform: 'none', borderColor: 'error.main', color: 'error.main' }}>Cancelar</Button>
              <Button type="submit" color="success" variant="contained" sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600 }}>Guardar</Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Modal Borrado */}
      <Dialog open={!!deleteUser} onClose={() => setDeleteUser(null)} PaperProps={{ sx: { borderRadius: 3, minWidth: 340 } }}>
        <DialogTitle sx={{ fontWeight: 600, fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, system-ui' }}>¿Eliminar usuario?</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>¿Estás seguro que quieres eliminar a <b>{deleteUser?.nombre} {deleteUser?.apellido}</b>? Esta acción no se puede deshacer.</Typography>
          <DialogActions sx={{ px: 0, pt: 2 }}>
            <Button onClick={() => setDeleteUser(null)} color="error" variant="outlined" sx={{ borderRadius: 999, textTransform: 'none', borderColor: 'error.main', color: 'error.main' }}>Cancelar</Button>
            <Button onClick={confirmDelete} color="error" variant="contained" sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600 }}>Eliminar</Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default Usuarios;
