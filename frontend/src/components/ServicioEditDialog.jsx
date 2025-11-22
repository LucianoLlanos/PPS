import React, { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Select, MenuItem, TextField, CircularProgress, Typography } from '@mui/material';
import { ServiciosService } from '../services/ServiciosService';
import { STATUSES } from '../utils/statusColors';

export default function ServicioEditDialog({ open, onClose, servicio, onSaved }) {
  const serviciosService = useMemo(() => new ServiciosService(), []);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (servicio) {
      setNuevoEstado(servicio.estado || '');
      setObservaciones(servicio.observacionesAdmin || '');
    } else {
      setNuevoEstado('');
      setObservaciones('');
    }
  }, [servicio, open]);

  const handleGuardar = async () => {
    if (!servicio || !nuevoEstado) return;
    setSaving(true);
    try {
      await serviciosService.updateAdmin(servicio.idSolicitud, { estado: nuevoEstado, observacionesAdmin: observaciones });
      const updated = await serviciosService.getByIdAdmin(servicio.idSolicitud);
      if (onSaved) onSaved(updated);
      if (onClose) onClose();
    } catch (e) {
      console.error('ServicioEditDialog save error', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Cambiar Estado - {servicio ? `#${servicio.idSolicitud}` : ''}</DialogTitle>
      <DialogContent dividers>
        {!servicio ? (
          <Typography>No hay solicitud seleccionada.</Typography>
        ) : (
          <>
            <Typography variant="caption">Nuevo estado</Typography>
            <Select fullWidth value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)} sx={{ mt: 1 }}>
              {STATUSES.map(st => <MenuItem key={st.value} value={st.value}>{st.label}</MenuItem>)}
            </Select>
            <Typography variant="caption" sx={{ mt: 2, display: 'block' }}>Observaciones (opcional)</Typography>
            <TextField fullWidth multiline rows={3} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} sx={{ mt: 1 }} />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button onClick={handleGuardar} variant="contained" disabled={saving || !nuevoEstado}>{saving ? 'Guardando...' : 'Guardar'}</Button>
      </DialogActions>
    </Dialog>
  );
}
