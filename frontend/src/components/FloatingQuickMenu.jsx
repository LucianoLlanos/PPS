import React, { useMemo, useState } from 'react';
import { Box, Fab, Tooltip } from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import InstagramIcon from '@mui/icons-material/Instagram';

/**
 * Botón flotante abajo a la derecha que despliega acciones hacia la izquierda.
 * Props opcionales:
 * - whatsapp: string | URL completo o número (se formatea a wa.me si son dígitos)
 * - instagram: string | URL completo o handle (@handle o solo handle)
 */
export default function FloatingQuickMenu({ whatsapp, instagram }) {
  const [open, setOpen] = useState(false);

  const waLink = useMemo(() => {
    const envPhone = import.meta?.env?.VITE_WHATSAPP_PHONE;
    const raw = whatsapp || envPhone || '';
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;
    const digits = ('' + raw).replace(/\D/g, '');
    if (!digits) return null;
    return `https://wa.me/${digits}`;
  }, [whatsapp]);

  const igLink = useMemo(() => {
    const envIg = import.meta?.env?.VITE_INSTAGRAM_HANDLE;
    const raw = instagram || envIg || '';
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;
    const handle = ('' + raw).replace(/^@/, '');
    if (!handle) return null;
    return `https://instagram.com/${handle}`;
  }, [instagram]);

  const actions = useMemo(() => [
    waLink && { key: 'wa', title: 'WhatsApp', color: '#25D366', href: waLink, icon: <WhatsAppIcon /> },
    igLink && { key: 'ig', title: 'Instagram', color: '#E1306C', href: igLink, icon: <InstagramIcon /> },
  ].filter(Boolean), [waLink, igLink]);

  return (
    <Box sx={{ position: 'fixed', right: 16, bottom: 'calc(16px + env(safe-area-inset-bottom))', zIndex: 1500 }}>
      {/* Acciones: se animan hacia la izquierda y quedan centradas verticalmente */}
      <Box sx={{
        position: 'absolute',
        right: 72,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        alignItems: 'center',
      }}>
        {actions.map((a, idx) => (
          <Tooltip key={a.key} title={a.title} placement="top">
            <Fab
              size="small"
              aria-label={a.title}
              sx={{
                ml: 1.5,
                color: '#fff',
                bgcolor: a.color,
                boxShadow: 3,
                transform: open ? `translateX(0)` : 'translateX(16px)',
                opacity: open ? 1 : 0,
                pointerEvents: open ? 'auto' : 'none',
                transition: 'transform 220ms ease, opacity 180ms ease, background-color 120ms ease',
                '&:hover': { bgcolor: a.color },
              }}
              onClick={() => {
                if (a.href) window.open(a.href, '_blank', 'noopener');
              }}
            >
              {a.icon}
            </Fab>
          </Tooltip>
        ))}
      </Box>

      {/* Botón principal */}
      <Tooltip title={open ? 'Cerrar' : 'Menú rápido'} placement="top">
        <Fab
          color="primary"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setOpen((v) => !v)}
          sx={{
            width: 54,
            height: 54,
            borderRadius: '50%',
            boxShadow: 4,
          }}
        >
          {open ? <CloseRoundedIcon /> : <MenuRoundedIcon />}
        </Fab>
      </Tooltip>
    </Box>
  );
}
