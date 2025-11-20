import React from 'react';
import { Box, Typography, Link, Grid, IconButton, Divider } from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { Phone, Email, Language, Instagram, Facebook, LinkedIn } from '@mui/icons-material';

export default function Footer(){
  const location = useLocation();
  const smoothTop = () => {
    try { window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }); }
    catch { window.scrollTo(0, 0); }
  };
  const handleNav = (path, e) => {
    // Si ya estamos en la misma ruta, solo scrollear y evitar navegación
    if (location.pathname === path) {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      smoothTop();
    }
    // Si es otra ruta, no hacemos nada especial: RouterLink navega y un
    // efecto global hará scroll al top tras el cambio de ruta.
  };
  return (
    <Box component="footer" sx={{
      width: '100%', m: 0, p: 0,
      background: 'linear-gradient(180deg,#0f4fa3 0%,#0d437f 100%)',
      color: 'white', pt: { xs: 4, md: 5 }, pb: { xs: 3, md: 4 },
      position: 'relative',
      maxWidth: '100%', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: { xs: 2.4, md: 3.2 },
      '&::before': {
        content: '""', position: 'absolute', top: 0, left: 0, right: 0,
        height: '2px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)'
      }
    }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto', width: '100%', px: { xs: 2.5, md: 4 } }}>
        <Grid container spacing={{ xs: 2, md: 4 }} alignItems="flex-start">
          {/* Columna navegación */}
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: { xs: 'center', md: 'left' }, py: 0.5 }}>
              <Typography component="h6" sx={{ mb: 1.6, fontWeight: 800, color: '#e3f2fd', letterSpacing: '.6px', fontSize: { xs: '1.05rem', md: '1.15rem' } }}>NAVEGACIÓN</Typography>
              <Grid container spacing={0.6}>
                <Grid item xs={6} md={12}>
                  <Box component="nav" aria-label="Navegación footer" sx={{ display: 'flex', flexDirection: 'column', gap: 0.85 }}>
                    <Link underline="hover" component={RouterLink} to="/" onClick={(e)=>handleNav('/', e)} sx={{ display: 'inline', alignSelf: 'flex-start', color: 'rgba(255,255,255,0.95)', textDecoration: 'none', fontSize: '0.98rem', fontWeight: 600, lineHeight: 1.6, textUnderlineOffset: '3px', transition: 'color .2s ease', '&:hover': { color: '#fff', textDecoration: 'underline' } }}>Inicio / Productos</Link>
                    <Link underline="hover" component={RouterLink} to="/servicios" onClick={(e)=>handleNav('/servicios', e)} sx={{ display: 'inline', alignSelf: 'flex-start', color: 'rgba(255,255,255,0.95)', textDecoration: 'none', fontSize: '0.98rem', fontWeight: 600, lineHeight: 1.6, textUnderlineOffset: '3px', transition: 'color .2s ease', '&:hover': { color: '#fff', textDecoration: 'underline' } }}>Servicios Post-Venta</Link>
                    <Link underline="hover" component={RouterLink} to="/acerca-de" onClick={(e)=>handleNav('/acerca-de', e)} sx={{ display: 'inline', alignSelf: 'flex-start', color: 'rgba(255,255,255,0.95)', textDecoration: 'none', fontSize: '0.98rem', fontWeight: 600, lineHeight: 1.6, textUnderlineOffset: '3px', transition: 'color .2s ease', '&:hover': { color: '#fff', textDecoration: 'underline' } }}>Acerca de la Empresa</Link>
                    <Link underline="hover" component={RouterLink} to="/politicas-terminos" onClick={(e)=>handleNav('/politicas-terminos', e)} sx={{ display: 'inline', alignSelf: 'flex-start', color: 'rgba(255,255,255,0.95)', textDecoration: 'none', fontSize: '0.98rem', fontWeight: 600, lineHeight: 1.6, textUnderlineOffset: '3px', transition: 'color .2s ease', '&:hover': { color: '#fff', textDecoration: 'underline' } }}>Políticas y Términos</Link>
                  </Box>
                </Grid>
                <Grid item xs={6} md={12}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, mt: { xs: 2.5, md: 3.25 } }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontWeight: 800, letterSpacing: '.6px', fontSize: '0.9rem' }}>ATENCIÓN</Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.92)', fontSize: '0.95rem' }}>Lun a Vie 8:00 - 18:00</Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.92)', fontSize: '0.95rem' }}>Sábados 9:00 - 13:00</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>
          {/* Columna central logo + contacto */}
          <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
            <Box sx={{ py: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box component="img" src="/logo.jpeg" alt="Atilio Marola Logo" sx={{ height: 84, width: 84, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.55)', boxShadow: '0 2px 8px rgba(0,0,0,0.25)', mb: 1.2 }} />
              <Typography component="h6" sx={{ mb: 1.2, fontWeight: 900, color: '#e3f2fd', letterSpacing: '.7px', fontSize: { xs: '1.1rem', md: '1.2rem' } }}>ATILIO MAROLA</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone sx={{ mr: 1, color: '#81c784', fontSize: '1.25rem' }} />
                  <Typography sx={{ fontWeight: 700, color: 'white', fontSize: '1rem' }}>381-5762418 / 381-4321553</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Email sx={{ mr: 1, color: '#64b5f6', fontSize: '1.25rem' }} />
                  <Link href="mailto:ventas@atiliomarola.com.ar" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.98rem', fontWeight: 600, '&:hover': { textDecoration: 'underline', color: '#e3f2fd' } }}>ventas@atiliomarola.com.ar</Link>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Language sx={{ mr: 1, color: '#ffb74d', fontSize: '1.25rem' }} />
                  <Link href="https://www.atiliomarola.com.ar" target="_blank" rel="noopener noreferrer" sx={{ color: 'white', textDecoration: 'none', fontSize: '0.98rem', fontWeight: 600, '&:hover': { textDecoration: 'underline', color: '#e3f2fd' } }}>www.atiliomarola.com.ar</Link>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.8, mt: 1 }}>
                <IconButton component="a" href="https://instagram.com/atiliomarola" target="_blank" rel="noopener noreferrer" size="medium" sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.12)', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)', transform: 'translateY(-2px)' }, transition: 'all 0.3s ease' }}><Instagram fontSize="small" /></IconButton>
                <IconButton component="a" href="https://facebook.com/atiliomarola" target="_blank" rel="noopener noreferrer" size="medium" sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.12)', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)', transform: 'translateY(-2px)' }, transition: 'all 0.3s ease' }}><Facebook fontSize="small" /></IconButton>
                <IconButton component="a" href="https://linkedin.com/company/atiliomarola" target="_blank" rel="noopener noreferrer" size="medium" sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.12)', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)', transform: 'translateY(-2px)' }, transition: 'all 0.3s ease' }}><LinkedIn fontSize="small" /></IconButton>
              </Box>
            </Box>
          </Grid>
          {/* Columna sucursales */}
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: { xs: 'center', md: 'right' }, py: 1, display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', md: 'flex-end' }, gap: 1.2 }}>
              <Typography component="h6" sx={{ mb: 1.6, fontWeight: 800, color: '#e3f2fd', letterSpacing: '.6px', fontSize: { xs: '1.05rem', md: '1.15rem' } }}>NUESTRAS UBICACIONES</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.4, alignItems: { xs: 'center', md: 'flex-end' } }}>
                <Box sx={{ p: 1.4, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.18)', width: { md: 300 }, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                  <Typography sx={{ fontWeight: 800, color: '#e3f2fd', mb: 0.6, fontSize: '1rem' }}>🏢 CASA CENTRAL</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', lineHeight: 1.6 }}>📍 Libertad 462<br/>San Miguel de Tucumán, Tucumán<br/>📞 381-5762418</Typography>
                </Box>
                <Box sx={{ p: 1.4, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.18)', width: { md: 300 }, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                  <Typography sx={{ fontWeight: 800, color: '#e3f2fd', mb: 0.6, fontSize: '1rem' }}>🌿 SUCURSAL YERBA BUENA</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', lineHeight: 1.6 }}>📍 Av. Aconquija 2399<br/>Yerba Buena, Tucumán<br/>📞 381-4321553</Typography>
                </Box>
                <Box sx={{ p: 1.4, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.18)', width: { md: 300 }, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                  <Typography sx={{ fontWeight: 800, color: '#e3f2fd', mb: 0.6, fontSize: '1rem' }}>🏔️ SUCURSAL CATAMARCA</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', lineHeight: 1.6 }}>📍 San Martín 360<br/>Santa María, Catamarca<br/>📞 03838-421789</Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.22)', my: 1.2 }} />
      <Box sx={{ textAlign: 'center', pt: 0.6, px: 2 }}>
        <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: { xs: '0.9rem', md: '0.95rem' }, fontWeight: 500 }}>&copy; {new Date().getFullYear()} Atilio Marola - Todos los derechos reservados</Typography>
      </Box>
    </Box>
  );
}
