import React from 'react';
import { Container, Typography, Box, Card, CardContent, Button } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ArticleIcon from '@mui/icons-material/Article';
import ContactMailIcon from '@mui/icons-material/ContactMail';

const Uploads = () => {
  const handleUploadPDF = () => {
    window.location.href = '/legacy#visits';
  };

  const handleScanCard = () => {
    window.location.href = '/legacy#contacts';
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <UploadFileIcon sx={{ color: '#3b82f6', fontSize: '1.5rem' }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1.1rem' }}>
          Uploads & Scanners
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
        {/* PDF Upload */}
        <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <ArticleIcon sx={{ fontSize: '3rem', color: '#3b82f6', mb: 2 }} />
            <Typography sx={{ color: '#f1f5f9', fontSize: '1rem', fontWeight: 600, mb: 1 }}>
              PDF Upload
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: '0.85rem', mb: 3 }}>
              Upload route PDFs to extract visit data automatically
            </Typography>
            <Button
              variant="contained"
              startIcon={<UploadFileIcon />}
              onClick={handleUploadPDF}
              sx={{
                backgroundColor: '#3b82f6',
                '&:hover': { backgroundColor: '#2563eb' },
                textTransform: 'none',
              }}
            >
              Upload PDF
            </Button>
          </CardContent>
        </Card>

        {/* Business Card Scanner */}
        <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <ContactMailIcon sx={{ fontSize: '3rem', color: '#22c55e', mb: 2 }} />
            <Typography sx={{ color: '#f1f5f9', fontSize: '1rem', fontWeight: 600, mb: 1 }}>
              Business Card Scanner
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: '0.85rem', mb: 3 }}>
              Scan business cards to extract contact information
            </Typography>
            <Button
              variant="contained"
              startIcon={<ContactMailIcon />}
              onClick={handleScanCard}
              sx={{
                backgroundColor: '#22c55e',
                '&:hover': { backgroundColor: '#16a34a' },
                textTransform: 'none',
              }}
            >
              Scan Card
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Uploads;

