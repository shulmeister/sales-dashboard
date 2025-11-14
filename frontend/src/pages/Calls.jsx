import React from 'react';
import { Container, Typography, Box, Card, CardContent } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';

const Calls = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <PhoneIcon sx={{ color: '#3b82f6', fontSize: '1.5rem' }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1.1rem' }}>
          Calls Tracker
        </Typography>
      </Box>

      <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <PhoneIcon sx={{ fontSize: '4rem', color: '#64748b', mb: 2 }} />
          <Typography sx={{ color: '#f1f5f9', fontSize: '1rem', mb: 1 }}>
            Call Tracking
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>
            Log and track your sales calls here. Feature coming soon.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Calls;

