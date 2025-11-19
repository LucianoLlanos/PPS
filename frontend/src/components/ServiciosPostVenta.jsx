import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ServiciosService } from '../services/ServiciosService';
import ExpandableText from './ExpandableText';
import useAuthStore from '../store/useAuthStore';
import '../stylos/ServiciosPostVenta.css';
import { getStatusInfo } from '../utils/statusColors';
import { Container, Grid, Card, CardContent, CardActions, Typography, Tabs, Tab, TextField, Select, MenuItem, Button, Alert, Chip, Box, CircularProgress, Paper, Divider, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import SendIcon from '@mui/icons-material/Send';

export default function ServiciosPostVenta() {
	const serviciosService = useMemo(() => new ServiciosService(), []);
	const [formData, setFormData] = useState({
		tipoServicio: '', descripcion: '', direccion: '', telefono: '', fechaPreferida: '', horaPreferida: ''
	});
	const [errors, setErrors] = useState({});
	const [tiposServicio, setTiposServicio] = useState([]);
	const [misSolicitudes, setMisSolicitudes] = useState([]);
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState('solicitar');
	const [detalle, setDetalle] = useState({ open: false, solicitud: null });

	// Controlar apertura de Selects para cerrar al hacer scroll
	const [openTipo, setOpenTipo] = useState(false);
	const [openHora, setOpenHora] = useState(false);
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
			const res = await serviciosService.getTipos();
			const tipos = Array.isArray(res) ? res : [];
			setTiposServicio(tipos);
		} catch (err) {
			// keep silent; UI will still work
			console.error('cargarTiposServicio', err);
		}
	}, [serviciosService]);

	const cargarMisSolicitudes = useCallback(async () => {
		try {
			const res = await serviciosService.misSolicitudes();
			setMisSolicitudes(Array.isArray(res) ? res : []);
		} catch (err) {
			console.error('cargarMisSolicitudes', err);
		}
	}, [serviciosService]);

	useEffect(() => {
		if (!user) { navigate('/login'); return; }
		cargarTiposServicio();
		cargarMisSolicitudes();
	}, [user, navigate, cargarTiposServicio, cargarMisSolicitudes]);

	// Cerrar selects si se scrollea la página
	useEffect(() => {
		if (!(openTipo || openHora)) return;
		const close = () => { setOpenTipo(false); setOpenHora(false); };
		window.addEventListener('scroll', close, { passive: true });
		return () => window.removeEventListener('scroll', close);
	}, [openTipo, openHora]);

	const handleField = (name, value) => setFormData(f => ({ ...f, [name]: value }));

	const validate = () => {
		const e = {};
		if (!formData.tipoServicio) e.tipoServicio = 'Seleccioná un tipo de servicio';
		if (!formData.descripcion || formData.descripcion.trim().length < 10) e.descripcion = 'Agregá una descripción (mínimo 10 caracteres)';
		if (!formData.direccion) e.direccion = 'Ingresá una dirección';
		if (!formData.fechaPreferida) e.fechaPreferida = 'Seleccioná una fecha';
		if (!formData.horaPreferida) e.horaPreferida = 'Seleccioná un horario';
		if (formData.fechaPreferida && formData.horaPreferida && !validateDateTime(formData.fechaPreferida, formData.horaPreferida)) e.horaPreferida = 'Debe ser con 24h de anticipación';
		setErrors(e);
		return Object.keys(e).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validate()) return;
		setLoading(true);
		try {
			await serviciosService.createSolicitud(formData);
			alert('Solicitud enviada correctamente');
			setFormData({ tipoServicio: '', descripcion: '', direccion: '', telefono: '', fechaPreferida: '', horaPreferida: '' });
			setErrors({});
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
				<Grid container spacing={3} alignItems="flex-start">
							  <Grid item xs={12} md={8}>
																								<Paper className="servicios-form-paper" elevation={0} sx={{ borderRadius: 0, overflow: 'hidden', border: '1px solid #e5e9ef', boxShadow: 'none', bgcolor: '#fff' }}>
													<CardContent className="servicios-form-body" sx={{ p: { xs: 2, md: 3 } }}>
											<Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Nueva Solicitud</Typography>
											<Box component="form" onSubmit={handleSubmit}>
												<Box sx={{ mb: 2 }}>
																										<Select 
																											className="servicios-field" 
																											fullWidth 
																											value={formData.tipoServicio} 
																											onChange={(e) => handleField('tipoServicio', e.target.value)} 
																											displayEmpty 
																											variant="outlined"
																											error={!!errors.tipoServicio}
																											open={openTipo}
																											onOpen={() => setOpenTipo(true)}
																											onClose={() => setOpenTipo(false)}
																											MenuProps={{ disableScrollLock: true }}
																										>
														<MenuItem value="">Selecciona un tipo de servicio</MenuItem>
														{tiposServicio.map((t, i) => (
															<MenuItem key={i} value={t.value || t}>{t.label || t}</MenuItem>
														))}
													</Select>
																										{errors.tipoServicio && <Typography color="error" variant="caption">{errors.tipoServicio}</Typography>}
												</Box>
												<Box sx={{ mb: 2 }}>
																										<TextField 
																											className="servicios-field" 
																											fullWidth 
																											multiline rows={4} 
																											value={formData.descripcion} 
																											onChange={(e) => handleField('descripcion', e.target.value)} 
																											placeholder="Descripción" 
																											variant="outlined"
																											error={!!errors.descripcion}
																											helperText={errors.descripcion || ''}
																										/>
												</Box>
												<Box sx={{ mb: 2 }}>
																										<TextField className="servicios-field" fullWidth value={formData.direccion} onChange={(e) => handleField('direccion', e.target.value)} placeholder="Dirección" variant="outlined" error={!!errors.direccion} helperText={errors.direccion || ''} />
												</Box>
												  <Grid container spacing={2} sx={{ mb: 2 }}>
													<Grid item xs={12} md={6}>
																											<TextField className="servicios-field" fullWidth type="date" value={formData.fechaPreferida} onChange={(e) => handleField('fechaPreferida', e.target.value)} inputProps={{ min: getMinDate() }} variant="outlined" error={!!errors.fechaPreferida} helperText={errors.fechaPreferida || ''} />
													</Grid>
													<Grid item xs={12} md={6}>
																											<Select className="servicios-field" fullWidth value={formData.horaPreferida} onChange={(e) => handleField('horaPreferida', e.target.value)} displayEmpty variant="outlined" error={!!errors.horaPreferida} open={openHora} onOpen={() => setOpenHora(true)} onClose={() => setOpenHora(false)} MenuProps={{ disableScrollLock: true }}>
															<MenuItem value="">Seleccionar hora</MenuItem>
															{['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'].map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
														</Select>
																											{errors.horaPreferida && <Typography color="error" variant="caption">{errors.horaPreferida}</Typography>}
													</Grid>
												</Grid>
																						<Box sx={{ mb: 2 }}>
																							<Alert severity="info">Importante: las solicitudes deben realizarse con al menos <strong>24 horas</strong> de anticipación.</Alert>
																						</Box>
																						<Box>
																							<Button className="servicios-submit-btn" type="submit" variant="contained" disabled={loading} startIcon={<SendIcon />} sx={{ borderRadius: 0, py: 1.2, fontWeight: 800 }}>{loading ? <CircularProgress size={18} color="inherit" /> : 'Enviar Solicitud'}</Button>
																						</Box>
											</Box>
										</CardContent>
									</Paper>
					</Grid>

								<Grid item xs={12} md={4}>
									<Paper className="servicios-info-paper" elevation={0} sx={{ p: 2, borderRadius: 0, border: '1px solid #e5e9ef', position: { md: 'sticky' }, top: { md: 24 }, boxShadow: 'none', bgcolor: '#fff' }}>
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
					<Grid container spacing={3} alignItems="flex-start">
					{misSolicitudes.length === 0 ? (
						<Grid item xs={12}>
						  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
							<Box sx={{ maxWidth: 760, width: '100%', border: '1px solid #e5e9ef', borderRadius: 0, p: { xs: 2.5, md: 3 }, textAlign: 'center', bgcolor: '#fff' }}>
							  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Aún no tienes solicitudes</Typography>
							  <Typography color="text.secondary">Enviá tu primera solicitud desde la pestaña "Solicitar Servicio"</Typography>
							</Box>
						  </Box>
						</Grid>
					) : (
							misSolicitudes.map(s => (
								<Grid item xs={12} md={6} key={s.idSolicitud}>
									<Card className="servicios-card" elevation={0} sx={{ borderRadius: 0, border: '1px solid #e5e9ef', boxShadow: 'none', bgcolor: '#fff' }}>
										<CardContent>
																					<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
																						<Typography sx={{ textTransform: 'capitalize', fontWeight: 600 }}>{(s.tipoServicio || '').replace('_',' ')}</Typography>
																																												{
																																													(() => {
																																														const info = getStatusInfo(s.estado);
																																															return <Chip label={info.label} size="small" sx={{ borderRadius: 0, backgroundColor: info.bg || info.bgColor || info.bgColor, color: info.color, fontWeight: 600, height: 28 }} />;
																																													})()
																																												}
																					</Box>
										<ExpandableText text={s.descripcion || ''} lines={3} className="servicios-history-description" maxLines={6} />
										<Box sx={{ mt: 1 }}>
											<Typography variant="body2" color="text.secondary">Creado: {new Date(s.fechaCreacion).toLocaleString()}</Typography>
										</Box>
									</CardContent>
																		<CardActions>
																				<Button size="small" sx={{ borderRadius: 0 }} onClick={() => setDetalle({ open: true, solicitud: s })}>Ver</Button>
									</CardActions>
								</Card>
							</Grid>
						))
					)}
				</Grid>
			)}

						{/* Modal de detalle de solicitud */}
						<Paper sx={{ display: 'none' }} />
						{detalle.open && (
							<>
							</>
						)}

						<Box>
							<Dialog open={detalle.open} onClose={() => setDetalle({ open: false, solicitud: null })} maxWidth="sm" fullWidth>
								<DialogTitle>Detalle de la solicitud</DialogTitle>
								<DialogContent dividers>
									{detalle.solicitud && (
										<Box>
											<Typography sx={{ mb: 1 }}><strong>Tipo:</strong> {(detalle.solicitud.tipoServicio || '').replace('_',' ')}</Typography>
											<Typography sx={{ mb: 1 }}><strong>Estado:</strong> {getStatusInfo(detalle.solicitud.estado).label}</Typography>
											{detalle.solicitud.descripcion && (
												<Box sx={{ mb: 1 }}>
													<Typography sx={{ fontWeight: 600, mb: 0.5 }}>Descripción</Typography>
													<Typography variant="body2" color="text.secondary">{detalle.solicitud.descripcion}</Typography>
												</Box>
											)}
											{detalle.solicitud.direccion && (
												<Typography sx={{ mb: 1 }}><strong>Dirección:</strong> {detalle.solicitud.direccion}</Typography>
											)}
											<Typography variant="body2" color="text.secondary">Creado: {new Date(detalle.solicitud.fechaCreacion).toLocaleString()}</Typography>
										</Box>
									)}
								</DialogContent>
								<DialogActions>
									<Button onClick={() => setDetalle({ open: false, solicitud: null })} variant="contained" sx={{ borderRadius: 0 }}>Cerrar</Button>
								</DialogActions>
							</Dialog>
						</Box>
		</Container>
	);
}

