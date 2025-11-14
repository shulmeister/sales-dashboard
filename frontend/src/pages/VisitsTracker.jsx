import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Card, CardContent, Table, TableHead, TableRow, TableCell, TableBody, Button } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import LocalCarWashIcon from '@mui/icons-material/LocalCarWash';

const VisitsTracker = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      const response = await fetch('/api/visits', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setVisits(data);
      }
    } catch (error) {
      console.error('Error fetching visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = () => {
    // Redirect to the legacy upload page or implement new upload
    window.location.href = '/legacy#visits';
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Typography sx={{ color: '#f1f5f9', fontSize: '0.8rem' }}>Loading visits...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <LocalCarWashIcon sx={{ color: '#3b82f6', fontSize: '1.5rem' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1.1rem' }}>
            Visits Tracker
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<UploadFileIcon />}
          onClick={handleUpload}
          sx={{
            backgroundColor: '#3b82f6',
            '&:hover': { backgroundColor: '#2563eb' },
            textTransform: 'none',
            fontSize: '0.85rem',
          }}
        >
          Upload PDF
        </Button>
      </Box>

      <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <CardContent sx={{ p: 2 }}>
          {visits.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.85rem' }}>Date</TableCell>
                  <TableCell sx={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.85rem' }}>Business Name</TableCell>
                  <TableCell sx={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.85rem' }}>Address</TableCell>
                  <TableCell sx={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.85rem' }}>City</TableCell>
                  <TableCell sx={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.85rem' }}>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visits.map((visit) => (
                  <TableRow key={visit.id} sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}>
                    <TableCell sx={{ color: '#f1f5f9', fontSize: '0.8rem' }}>
                      {visit.visit_date ? new Date(visit.visit_date).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell sx={{ color: '#f1f5f9', fontSize: '0.8rem' }}>{visit.business_name}</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>{visit.address || '-'}</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>{visit.city || '-'}</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>{visit.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography sx={{ color: '#64748b', fontSize: '0.9rem', mb: 2 }}>
                No visits recorded yet.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={handleUpload}
                sx={{
                  color: '#3b82f6',
                  borderColor: '#3b82f6',
                  '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.05)' },
                  textTransform: 'none',
                }}
              >
                Upload Your First Visit PDF
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default VisitsTracker;

