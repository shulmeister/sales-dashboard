import React, { useState, useRef } from 'react';
import { Box, Typography, Container, Grid, Card, CardContent, Button, LinearProgress } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const Uploads = () => {
  const [pdfStatus, setPdfStatus] = useState({ display: false, message: '', type: '' });
  const [pdfResults, setPdfResults] = useState(null);
  const [cardStatus, setCardStatus] = useState({ display: false, message: '', type: '' });
  const [cardResults, setCardResults] = useState(null);
  const [pdfDragging, setPdfDragging] = useState(false);
  const [cardDragging, setCardDragging] = useState(false);
  
  const pdfInputRef = useRef(null);
  const cardInputRef = useRef(null);

  // PDF Upload Handler
  const handlePdfFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    setPdfStatus({ display: true, message: '⏳ Processing...', type: 'info' });
    setPdfResults(null);

    try {
      const response = await fetch('/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        let errorDetail = `Server error (${response.status})`;
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail || errorData.error || errorDetail;
        } catch (e) {
          errorDetail = await response.text().catch(() => errorDetail);
        }
        throw new Error(errorDetail);
      }

      const result = await response.json();

      if (result.success) {
        setPdfStatus({ display: true, message: '✅ Upload successful!', type: 'success' });
        setPdfResults(result);
      } else {
        throw new Error(result.error || result.detail || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      let errorMessage = error.message || 'Upload failed';
      if (errorMessage.includes('HEIC') || errorMessage.includes('heic')) {
        errorMessage = 'Unable to process HEIC file. Please convert to JPEG or PNG.';
      }
      setPdfStatus({ display: true, message: `❌ ${errorMessage}`, type: 'error' });
    }
  };

  // Business Card Scanner Handler
  const handleCardFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    setCardStatus({ display: true, message: '⏳ Scanning business card...', type: 'info' });
    setCardResults(null);

    try {
      const response = await fetch('/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Server error (${response.status})`);
      }

      const result = await response.json();

      if (result.success) {
        setCardStatus({ display: true, message: '✅ Scan successful!', type: 'success' });
        setCardResults(result);
      } else {
        throw new Error(result.error || 'Scan failed');
      }
    } catch (error) {
      console.error('Scan error:', error);
      setCardStatus({ display: true, message: `❌ ${error.message}`, type: 'error' });
    }
  };

  const savePdfData = async () => {
    if (!pdfResults || !pdfResults.visits) return;

    try {
      for (const visit of pdfResults.visits) {
        await fetch('/api/visits', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(visit)
        });
      }
      setPdfStatus({ display: true, message: '✅ Data saved successfully!', type: 'success' });
      setPdfResults(null);
    } catch (error) {
      console.error('Save error:', error);
      setPdfStatus({ display: true, message: `❌ Failed to save data: ${error.message}`, type: 'error' });
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: '#f1f5f9', fontWeight: 600 }}>
        Uploads & Scanners
      </Typography>

      <Grid container spacing={3}>
        {/* PDF Upload */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <DescriptionIcon sx={{ color: '#3b82f6', fontSize: '2rem' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#f1f5f9', fontSize: '1rem' }}>
                    PDF Upload
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                    Upload route PDFs to extract visit data automatically
                  </Typography>
                </Box>
              </Box>

              <Box
                onDragOver={(e) => { e.preventDefault(); setPdfDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setPdfDragging(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  setPdfDragging(false);
                  if (e.dataTransfer.files[0]) handlePdfFile(e.dataTransfer.files[0]);
                }}
                onClick={() => pdfInputRef.current.click()}
                sx={{
                  border: '2px dashed',
                  borderColor: pdfDragging ? '#3b82f6' : '#475569',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: pdfDragging ? '#1e293b' : '#0f172a',
                  transition: 'all 0.3s',
                  '&:hover': {
                    borderColor: '#3b82f6',
                    backgroundColor: '#1e293b',
                  },
                }}
              >
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.heic,.heif"
                  style={{ display: 'none' }}
                  onChange={(e) => { if (e.target.files[0]) handlePdfFile(e.target.files[0]); }}
                />
                <CloudUploadIcon sx={{ fontSize: '3rem', color: '#64748b', mb: 1 }} />
                <Typography sx={{ color: '#f1f5f9', fontSize: '1rem', mb: 0.5 }}>
                  Choose File or Drag & Drop
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                  Supported: PDF, JPG, PNG, HEIC
                </Typography>
              </Box>

              {pdfStatus.display && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    borderRadius: 1,
                    backgroundColor: pdfStatus.type === 'success' ? '#065f46' : pdfStatus.type === 'error' ? '#7f1d1d' : '#1e293b',
                    color: pdfStatus.type === 'success' ? '#d1fae5' : pdfStatus.type === 'error' ? '#fecaca' : '#f1f5f9',
                    border: '1px solid',
                    borderColor: pdfStatus.type === 'success' ? '#10b981' : pdfStatus.type === 'error' ? '#ef4444' : '#334155',
                  }}
                >
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                    {pdfStatus.message}
                  </Typography>
                </Box>
              )}

              {pdfResults && pdfResults.visits && (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 600, mb: 1 }}>
                    Extracted Visits ({pdfResults.visits.length})
                  </Typography>
                  {pdfResults.visits.map((visit, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: 1,
                        p: 1.5,
                        mb: 1,
                      }}
                    >
                      <Typography sx={{ color: '#f1f5f9', fontSize: '0.8rem' }}>
                        <strong>Date:</strong> {visit.date}
                      </Typography>
                      <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                        {visit.client_name} • {visit.caregiver_name}
                      </Typography>
                      <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                        Hours: {visit.hours} • Cost: ${visit.cost}
                      </Typography>
                    </Box>
                  ))}
                  <Button
                    variant="contained"
                    onClick={savePdfData}
                    sx={{
                      mt: 2,
                      backgroundColor: '#3b82f6',
                      '&:hover': { backgroundColor: '#2563eb' },
                      textTransform: 'none',
                    }}
                  >
                    Save All Data
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Business Card Scanner */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <ContactMailIcon sx={{ color: '#10b981', fontSize: '2rem' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#f1f5f9', fontSize: '1rem' }}>
                    Business Card Scanner
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                    Scan business cards to extract contact information
                  </Typography>
                </Box>
              </Box>

              <Box
                onDragOver={(e) => { e.preventDefault(); setCardDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setCardDragging(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  setCardDragging(false);
                  if (e.dataTransfer.files[0]) handleCardFile(e.dataTransfer.files[0]);
                }}
                onClick={() => cardInputRef.current.click()}
                sx={{
                  border: '2px dashed',
                  borderColor: cardDragging ? '#10b981' : '#475569',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: cardDragging ? '#1e293b' : '#0f172a',
                  transition: 'all 0.3s',
                  '&:hover': {
                    borderColor: '#10b981',
                    backgroundColor: '#1e293b',
                  },
                }}
              >
                <input
                  ref={cardInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => { if (e.target.files[0]) handleCardFile(e.target.files[0]); }}
                />
                <ContactMailIcon sx={{ fontSize: '3rem', color: '#64748b', mb: 1 }} />
                <Typography sx={{ color: '#f1f5f9', fontSize: '1rem', mb: 0.5 }}>
                  Choose Image or Drag & Drop
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                  Supported: JPG, PNG, HEIC
                </Typography>
              </Box>

              {cardStatus.display && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    borderRadius: 1,
                    backgroundColor: cardStatus.type === 'success' ? '#065f46' : cardStatus.type === 'error' ? '#7f1d1d' : '#1e293b',
                    color: cardStatus.type === 'success' ? '#d1fae5' : cardStatus.type === 'error' ? '#fecaca' : '#f1f5f9',
                    border: '1px solid',
                    borderColor: cardStatus.type === 'success' ? '#10b981' : cardStatus.type === 'error' ? '#ef4444' : '#334155',
                  }}
                >
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                    {cardStatus.message}
                  </Typography>
                </Box>
              )}

              {cardResults && cardResults.contact && (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 600, mb: 1 }}>
                    Extracted Contact
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: 1,
                      p: 2,
                    }}
                  >
                    <Typography sx={{ color: '#f1f5f9', fontSize: '0.85rem', mb: 0.5 }}>
                      <strong>Name:</strong> {cardResults.contact.name || 'N/A'}
                    </Typography>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem', mb: 0.5 }}>
                      <strong>Phone:</strong> {cardResults.contact.phone || 'N/A'}
                    </Typography>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem', mb: 0.5 }}>
                      <strong>Email:</strong> {cardResults.contact.email || 'N/A'}
                    </Typography>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                      <strong>Company:</strong> {cardResults.contact.company || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Uploads;
