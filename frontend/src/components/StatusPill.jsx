import React from 'react';
import { Box } from '@mui/material';
import { getStatusInfo } from '../utils/statusColors';

export default function StatusPill({ value, label, variant = 'chip' }) {
  const info = getStatusInfo(value);
  const content = (
    <>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: info.color }} />
      <span>{label || info.label || value}</span>
    </>
  );

  if (variant === 'inline') {
    return (
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, color: info.color, fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.2 }}>
        {content}
      </Box>
    );
  }

  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.2, py: 0.4, borderRadius: 999, backgroundColor: info.bg, color: info.color, fontWeight: 600, fontSize: '0.82rem', lineHeight: 1.2, border: `1px solid ${info.color}22` }} title={label || info.label || value}>
      {content}
    </Box>
  );
}
