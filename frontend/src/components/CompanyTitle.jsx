import React from 'react';
import { Box, Typography, Container } from '@mui/material';

export default function CompanyTitle() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography
          variant="h2"
          component="h1"
          sx={{
            fontWeight: 800,
            color: 'text.primary',
            mb: 2,
            fontSize: { xs: '2.2rem', md: '3.2rem' },
            background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          AtilioMarola
        </Typography>
        <Typography
          variant="h5"
          component="h2"
          sx={{
            color: 'text.secondary',
            fontWeight: 400,
            fontSize: { xs: '1.1rem', md: '1.4rem' },
            maxWidth: 650,
            mx: 'auto',
            lineHeight: 1.4
          }}
        >
          Herramientas y soluciones para agua y energía — calidad industrial
        </Typography>
      </Box>
    </Container>
  );
}