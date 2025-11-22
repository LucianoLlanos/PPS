import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ServiciosService } from '../services/ServiciosService';
import { Container, Card, CardHeader, CardContent, CardActions, Typography, Box, Button, Divider, CircularProgress } from '@mui/material';
import { getStatusInfo } from '../utils/statusColors';
import StatusPill from './StatusPill';
import ServicioEditDialog from './ServicioEditDialog';

export default function ServicioDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const serviciosService = useMemo(() => new ServiciosService(), []);
  const [servicio, setServicio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await serviciosService.getByIdAdmin(id);
        setServicio(data);
        setError(null);
      } catch (e) {
        console.error('Error fetching servicio', e);
        setError('No se pudo cargar la solicitud');
      } finally { setLoading(false); }
    };
    if (id) fetch();
  }, [id]);

  if (loading) return <Container sx={{ py: 6 }}><CircularProgress /></Container>;
  if (error) return <Container sx={{ py: 6 }}><Typography color="error">{error}</Typography></Container>;
  if (!servicio) return <Container sx={{ py: 6 }}><Typography>No se encontró la solicitud.</Typography></Container>;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button variant="outlined" onClick={() => navigate('/servicios-admin')} sx={{ mb: 2 }}>Volver a la lista</Button>
      <Card>
        <CardHeader
          title={`Solicitud #${servicio.idSolicitud}`}
          subheader={`Creado: ${new Date(servicio.fechaCreacion).toLocaleString()}`}
          action={<StatusPill value={servicio.estado} label={getStatusInfo(servicio.estado).label} />}
        />
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Cliente</Typography>
            <Typography><strong>{servicio.nombre} {servicio.apellido}</strong></Typography>
            <Typography variant="body2" color="text.secondary">{servicio.email}</Typography>
            {servicio.clienteTelefono && <Typography variant="body2" color="text.secondary">{servicio.clienteTelefono}</Typography>}
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Dirección</Typography>
            <Typography>{servicio.direccion}</Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box>
            <Typography variant="subtitle2">Tipo de servicio</Typography>
            <Typography>{servicio.tipoServicio}</Typography>
            <Typography variant="subtitle2" sx={{ mt: 1 }}>Descripción</Typography>
            <Typography>{servicio.descripcion}</Typography>
            {(servicio.fechaPreferida || servicio.horaPreferida) && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2">Fecha preferida</Typography>
                <Typography>{servicio.fechaPreferida ? new Date(servicio.fechaPreferida).toLocaleDateString() : ''}{servicio.horaPreferida ? ` a las ${servicio.horaPreferida}` : ''}</Typography>
              </>
            )}
            {servicio.observacionesAdmin && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2">Observaciones Admin</Typography>
                <Typography color="text.secondary">{servicio.observacionesAdmin}</Typography>
              </>
            )}
          </Box>
        </CardContent>
        <CardActions>
          <Button variant="contained" onClick={() => setEditOpen(true)}>Cambiar Estado</Button>
        </CardActions>
      </Card>

      <ServicioEditDialog
        open={editOpen}
        servicio={servicio}
        onClose={() => setEditOpen(false)}
        onSaved={(updated) => setServicio(updated)}
      />
    </Container>
  );
}
