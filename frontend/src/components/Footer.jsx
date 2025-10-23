import React from 'react';
import { Box, Typography } from '@mui/material';

export default function Footer(){
  return (
    <Box component="footer" sx={{ mt: 5, pt: 4, borderTop: 1, borderColor: 'divider' }}>
      <Typography align="center" color="text.secondary">&copy; {new Date().getFullYear()} Mi Tienda - Proyecto PPS</Typography>
    </Box>
  );
}
