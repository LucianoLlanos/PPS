import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ExpandableText from './ExpandableText';
import useAuthStore from '../store/useAuthStore';
import '../stylos/ServiciosPostVenta.css';
import { getStatusInfo } from '../utils/statusColors';
import { Container, Grid, Card, CardContent, CardActions, Typography, Tabs, Tab, TextField, Select, MenuItem, Button, Alert, Chip, Box, CircularProgress, Paper, Divider } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import SendIcon from '@mui/icons-material/Send';

export default function ServiciosPostVenta() {
	const [formData, setFormData] = useState({
		tipoServicio: '', descripcion: '', direccion: '', telefono: '', fechaPreferida: '', horaPreferida: ''
	});
	const [tiposServicio, setTiposServicio] = useState([]);
	const [misSolicitudes, setMisSolicitudes] = useState([]);
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState('solicitar');
	const { user } = useAuthStore();
	const navigate = useNavigate();

	const getMinDate = () => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		return tomorrow.toISOString().split('T')[0];
	};

	const validateDateTime = (fecha, hora) => {
		if (!fecha || !hora) return true;
		const selected = new Date(`${fecha}T${hora}`);
		const min = new Date(); min.setHours(min.getHours() + 24);
		return selected >= min;
	};

	const cargarTiposServicio = useCallback(async () => {
		try {
			const res = await api.get('/servicios/tipos');
			setTiposServicio(res.data || []);
		} catch (err) {
			// keep silent; UI will still work
			console.error('cargarTiposServicio', err);
		}
	}, []);

	const cargarMisSolicitudes = useCallback(async () => {
		try {
			const res = await api.get('/servicios/mis-solicitudes');
			setMisSolicitudes(res.data || []);
		} catch (err) {
			console.error('cargarMisSolicitudes', err);
		}
	}, []);

	useEffect(() => {
		if (!user) { navigate('/login'); return; }
		cargarTiposServicio();
		cargarMisSolicitudes();
	}, [user, navigate, cargarTiposServicio, cargarMisSolicitudes]);

	const handleField = (name, value) => setFormData(f => ({ ...f, [name]: value }));

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (formData.fechaPreferida && formData.horaPreferida && !validateDateTime(formData.fechaPreferida, formData.horaPreferida)) {
			alert('La fecha y hora debe ser con mínimo 24 horas de anticipación');
			return;
		}
		setLoading(true);
		try {
			await api.post('/servicios/solicitar', formData);
			alert('Solicitud enviada correctamente');
			setFormData({ tipoServicio: '', descripcion: '', direccion: '', telefono: '', fechaPreferida: '', horaPreferida: '' });
			await cargarMisSolicitudes();
			setActiveTab('historial');
		} catch (err) {
			console.error('submit', err);
			alert('Error al enviar la solicitud');
		} finally { setLoading(false); }
	};

	return (
			<Container className="servicios-apple servicios-container" maxWidth="lg" sx={{ mt: 2, px: { xs: 2, md: 3 } }}>
				<Typography variant="h3" sx={{ mb: 1, fontWeight: 700 }}>Servicios Post-Venta</Typography>
				<Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} textColor="primary" indicatorColor="primary" sx={{ mb: 3 }}>
					<Tab value="solicitar" label="Solicitar Servicio" sx={{ textTransform: 'uppercase', fontSize: '0.75rem' }} />
					<Tab value="historial" label={`Mis Solicitudes (${misSolicitudes.length})`} sx={{ textTransform: 'uppercase', fontSize: '0.75rem' }} />
				</Tabs>

			{activeTab === 'solicitar' && (
				<Grid container spacing={3}>
							  <Grid item xs={12} md={8}>
												<Paper className="servicios-form-paper" elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
													<CardContent className="servicios-form-body" sx={{ p: 3 }}>
											<Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Nueva Solicitud</Typography>
											<Box component="form" onSubmit={handleSubmit}>
												<Box sx={{ mb: 2 }}>
													<Select className="servicios-field" fullWidth value={formData.tipoServicio} onChange={(e) => handleField('tipoServicio', e.target.value)} displayEmpty variant="outlined">
														<MenuItem value="">Selecciona un tipo de servicio</MenuItem>
														{tiposServicio.map((t, i) => (
															<MenuItem key={i} value={t.value || t}>{t.label || t}</MenuItem>
														))}
													</Select>
												</Box>
												<Box sx={{ mb: 2 }}>
													<TextField className="servicios-field" fullWidth multiline rows={4} value={formData.descripcion} onChange={(e) => handleField('descripcion', e.target.value)} placeholder="Descripción" variant="outlined" />
												</Box>
												<Box sx={{ mb: 2 }}>
													<TextField className="servicios-field" fullWidth value={formData.direccion} onChange={(e) => handleField('direccion', e.target.value)} placeholder="Dirección" variant="outlined" />
												</Box>
												  <Grid container spacing={2} sx={{ mb: 2 }}>
													<Grid item xs={12} md={6}>
														  <TextField className="servicios-field" fullWidth type="date" value={formData.fechaPreferida} onChange={(e) => handleField('fechaPreferida', e.target.value)} inputProps={{ min: getMinDate() }} variant="outlined" />
													</Grid>
													<Grid item xs={12} md={6}>
														  <Select className="servicios-field" fullWidth value={formData.horaPreferida} onChange={(e) => handleField('horaPreferida', e.target.value)} displayEmpty variant="outlined">
															<MenuItem value="">Seleccionar hora</MenuItem>
															{['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'].map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
														</Select>
													</Grid>
												</Grid>
																						<Box sx={{ mb: 2 }}>
																							<Alert severity="info">Importante: las solicitudes deben realizarse con al menos <strong>24 horas</strong> de anticipación.</Alert>
																						</Box>
																						<Box>
																							<Button className="servicios-submit-btn" type="submit" variant="contained" disabled={loading} startIcon={<SendIcon />}>{loading ? <CircularProgress size={18} color="inherit" /> : 'Enviar Solicitud'}</Button>
																						</Box>
											</Box>
										</CardContent>
									</Paper>
					</Grid>

								<Grid item xs={12} md={4}>
									<Paper className="servicios-info-paper" elevation={1} sx={{ p: 2, borderRadius: 2 }}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
											<InfoIcon color="primary" />
											<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Información</Typography>
										</Box>
										<Divider sx={{ mb: 1 }} />
										<Box component="ul" sx={{ pl: 2, m: 0 }}>
											<li><Typography variant="body2">Responderemos tu solicitud en 24-48 horas</Typography></li>
											<li><Typography variant="body2">Servicio disponible en San Miguel de Tucumán</Typography></li>
										</Box>
									</Paper>
								</Grid>
				</Grid>
			)}

			{activeTab === 'historial' && (
					<Grid container spacing={3}>
					{misSolicitudes.length === 0 ? (
						<Grid item xs={12}><Typography>No tienes solicitudes de servicio</Typography></Grid>
					) : (
							misSolicitudes.map(s => (
								<Grid item xs={12} md={6} key={s.idSolicitud}>
									<Card className="servicios-card">
										<CardContent>
																					<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
																						<Typography sx={{ textTransform: 'capitalize', fontWeight: 600 }}>{(s.tipoServicio || '').replace('_',' ')}</Typography>
																																												{
																																													(() => {
																																														const info = getStatusInfo(s.estado);
																																														return <Chip label={info.label} size="small" sx={{ backgroundColor: info.bg || info.bgColor || info.bgColor, color: info.color, fontWeight: 600, height: 28 }} />;
																																													})()
																																												}
																					</Box>
										<ExpandableText text={s.descripcion || ''} lines={3} className="servicios-history-description" maxLines={6} />
										<Box sx={{ mt: 1 }}>
											<Typography variant="body2" color="text.secondary">Creado: {new Date(s.fechaCreacion).toLocaleString()}</Typography>
										</Box>
									</CardContent>
									<CardActions>
										<Button size="small" onClick={() => { /* abrir modal no implementado aún */ }}>Ver</Button>
									</CardActions>
								</Card>
							</Grid>
						))
					)}
				</Grid>
			)}
		</Container>
	);
}

