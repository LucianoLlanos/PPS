import React from 'react';
import { Box, Typography, Link, Grid, IconButton, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Phone, Email, Language, Instagram, Facebook, LinkedIn } from '@mui/icons-material';

export default function Footer(){
  return (
    <Box 
      component="footer" 
      sx={{ 
        width: '100vw',
        margin: 0,
        padding: 0,
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        color: 'white',
        pt: 8,
        pb: 4,
        position: 'relative',
        // Técnica para ocupar todo el ancho desde cualquier contenedor
        marginLeft: 'calc(-50vw + 50%)',
        marginRight: 'calc(-50vw + 50%)',
        maxWidth: 'none',
        boxSizing: 'border-box',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)'
        }
      }}
    >
      {/* Layout principal: Enlaces - Logo - Sucursales distribuido en todo el ancho */}
      <Grid container spacing={0} sx={{ 
        width: '100%', 
        position: 'relative', 
        mb: 4, 
        minHeight: { md: '500px' },
        alignItems: 'flex-start' 
      }}>
        
        {/* IZQUIERDA: Enlaces y navegación */}
        <Grid item xs={12} md={4} sx={{ pl: { xs: 2, md: 6 } }}>
          <Box sx={{ textAlign: { xs: 'center', md: 'left' }, height: '100%', py: 2, pt: { md: 6 } }}>
            <Typography variant="h5" sx={{ mb: 4, fontWeight: 700, color: '#e3f2fd', fontSize: { xs: '1.3rem', md: '1.5rem' } }}>
              NAVEGACIÓN
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Link 
                component={RouterLink} 
                to="/" 
                sx={{ 
                  color: 'rgba(255,255,255,0.9)',
                  textDecoration: 'none', 
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&:hover': {
                    color: 'white',
                    textDecoration: 'underline',
                    transform: 'translateX(5px)',
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                🏠 Inicio / Productos
              </Link>
              <Link 
                component={RouterLink} 
                to="/servicios" 
                sx={{ 
                  color: 'rgba(255,255,255,0.9)',
                  textDecoration: 'none', 
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&:hover': {
                    color: 'white',
                    textDecoration: 'underline',
                    transform: 'translateX(5px)',
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                🔧 Servicios Post-Venta
              </Link>
              <Link 
                component={RouterLink} 
                to="/acerca-de" 
                sx={{ 
                  color: 'rgba(255,255,255,0.9)',
                  textDecoration: 'none', 
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&:hover': {
                    color: 'white',
                    textDecoration: 'underline',
                    transform: 'translateX(5px)',
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                ℹ️ Acerca de la Empresa
              </Link>
              <Link 
                component={RouterLink} 
                to="/politicas-terminos" 
                sx={{ 
                  color: 'rgba(255,255,255,0.9)',
                  textDecoration: 'none', 
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&:hover': {
                    color: 'white',
                    textDecoration: 'underline',
                    transform: 'translateX(5px)',
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                � Políticas y Términos
              </Link>
            </Box>
          </Box>
        </Grid>

        {/* CENTRO: Logo y contacto principal - Posicionado absolutamente en el centro */}
        <Grid item xs={12} md={4} sx={{ 
          position: { md: 'absolute' },
          left: { md: '50%' },
          transform: { md: 'translateX(-50%)' },
          top: { md: 0 },
          zIndex: 2,
          px: { xs: 2, md: 0 }
        }}>
          <Box sx={{ 
            textAlign: 'center', 
            height: '100%', 
            py: 2, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Box
              component="img"
              src="/logo.jpeg"
              alt="Atilio Marola Logo"
              sx={{
                height: 120,
                width: 120,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid rgba(255,255,255,0.8)',
                boxShadow: '0 6px 25px rgba(0,0,0,0.3)',
                mb: 4
              }}
            />
            <Typography variant="h3" sx={{ mb: 4, fontWeight: 800, color: '#e3f2fd', textShadow: '2px 2px 4px rgba(0,0,0,0.4)', fontSize: { xs: '2rem', md: '2.5rem' } }}>
              ATILIO MAROLA
            </Typography>
            
            {/* Enlaces de contacto principales - Agrandados */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <Phone sx={{ mr: 2, color: '#81c784', fontSize: '1.8rem' }} />
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'white', fontSize: '1.5rem' }}>
                  381-5762418 / 381-4321553
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <Email sx={{ mr: 2, color: '#64b5f6', fontSize: '1.8rem' }} />
                <Link 
                  href="mailto:ventas@atiliomarola.com.ar"
                  sx={{ 
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '1.3rem',
                    fontWeight: 500,
                    '&:hover': {
                      textDecoration: 'underline',
                      color: '#e3f2fd'
                    }
                  }}
                >
                  ventas@atiliomarola.com.ar
                </Link>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Language sx={{ mr: 2, color: '#ffb74d', fontSize: '1.8rem' }} />
                <Link 
                  href="https://www.atiliomarola.com.ar"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ 
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '1.3rem',
                    fontWeight: 500,
                    '&:hover': {
                      textDecoration: 'underline',
                      color: '#e3f2fd'
                    }
                  }}
                >
                  www.atiliomarola.com.ar
                </Link>
              </Box>
            </Box>

            {/* Redes sociales */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
              <IconButton
                component="a"
                href="https://instagram.com/atiliomarola"
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{ 
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.2)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <Instagram fontSize="small" />
              </IconButton>
              
              <IconButton
                component="a"
                href="https://facebook.com/atiliomarola"
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{ 
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.2)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <Facebook fontSize="small" />
              </IconButton>
              
              <IconButton
                component="a"
                href="https://linkedin.com/company/atiliomarola"
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{ 
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.2)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <LinkedIn fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Grid>

        {/* DERECHA: Información de sucursales - Posicionado absolutamente a la derecha */}
        <Grid item xs={12} md={4} sx={{ 
          position: { md: 'absolute' },
          right: { md: '150px' },
          top: { md: 0 },
          px: { xs: 2, md: 0 },
          width: { md: 'auto' },
          minWidth: { md: '350px' }
        }}>
          <Box sx={{ 
            textAlign: { xs: 'center', md: 'right' }, 
            height: '100%', 
            py: 2, 
            pt: { md: 4 },
            pb: { md: 8 },
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'flex-start',
            alignItems: { xs: 'center', md: 'flex-end' }
          }}>
            <Typography variant="h5" sx={{ 
              mb: 4, 
              fontWeight: 700, 
              color: '#e3f2fd', 
              fontSize: { xs: '1.3rem', md: '1.5rem' },
              textAlign: { xs: 'center', md: 'right' }
            }}>
              NUESTRAS UBICACIONES
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, alignItems: { xs: 'center', md: 'flex-end' } }}>
              {/* Casa Central */}
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                bgcolor: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.1)',
                textAlign: { xs: 'center', md: 'right' },
                width: { md: '280px' },
                mr: { md: 0 },
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.08)',
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                }
              }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#e3f2fd', mb: 1, fontSize: '1.1rem' }}>
                  🏢 CASA CENTRAL
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', lineHeight: 1.4 }}>
                  📍 Libertad 462<br />
                  San Miguel de Tucumán, Tucumán<br />
                  📞 381-5762418
                </Typography>
              </Box>

              {/* Sucursal Yerba Buena */}
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                bgcolor: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.1)',
                textAlign: { xs: 'center', md: 'right' },
                width: { md: '280px' },
                mr: { md: 0 },
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.08)',
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                }
              }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#e3f2fd', mb: 1, fontSize: '1.1rem' }}>
                  🌿 SUCURSAL YERBA BUENA
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', lineHeight: 1.4 }}>
                  📍 Av. Aconquija 2399<br />
                  Yerba Buena, Tucumán<br />
                  📞 381-4321553
                </Typography>
              </Box>

              {/* Sucursal Catamarca */}
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                bgcolor: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.1)',
                textAlign: { xs: 'center', md: 'right' },
                width: { md: '280px' },
                mr: { md: 0 },
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.08)',
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                }
              }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#e3f2fd', mb: 1, fontSize: '1.1rem' }}>
                  🏔️ SUCURSAL CATAMARCA
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', lineHeight: 1.4 }}>
                  📍 San Martín 360<br />
                  Santa María, Catamarca<br />
                  📞 03838-421789
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)', mb: 3 }} />

      {/* Copyright */}
      <Box sx={{ textAlign: 'center', pt: 2, px: 2 }}>
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'rgba(255,255,255,0.7)',
            fontSize: '0.8rem'
          }}
        >
          &copy; {new Date().getFullYear()} Atilio Marola - Todos los derechos reservados
        </Typography>
      </Box>
    </Box>
  );
}
