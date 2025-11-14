import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    contact_info: '',
    source_type: 'hospital',
    notes: '',
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/pipeline/referral-sources', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'hospital': return '#3b82f6';
      case 'clinic': return '#22c55e';
      case 'community': return '#f59e0b';
      case 'agency': return '#8b5cf6';
      default: return '#94a3b8';
    }
  };

  const handleOpenModal = (company = null) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        name: company.name || '',
        contact_person: company.contact_person || '',
        contact_info: company.contact_info || '',
        source_type: company.source_type || 'hospital',
        notes: company.notes || '',
      });
    } else {
      setEditingCompany(null);
      setFormData({
        name: '',
        contact_person: '',
        contact_info: '',
        source_type: 'hospital',
        notes: '',
      });
    }
    setOpenModal(true);
  };

  const handleSaveCompany = async () => {
    try {
      const url = editingCompany 
        ? `/api/pipeline/referral-sources/${editingCompany.id}`
        : '/api/pipeline/referral-sources';
      
      const method = editingCompany ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchCompanies();
        setOpenModal(false);
      }
    } catch (error) {
      console.error('Error saving company:', error);
    }
  };

  const handleDeleteCompany = async (companyId) => {
    if (!confirm('Are you sure you want to delete this company?')) return;
    
    try {
      const response = await fetch(`/api/pipeline/referral-sources/${companyId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchCompanies();
      }
    } catch (error) {
      console.error('Error deleting company:', error);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 1.5 }}>
        <Typography sx={{ color: '#f1f5f9', fontSize: '0.8rem' }}>Loading companies...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 1.5 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1.1rem' }}>
          Companies (Referral Sources)
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal()}
          sx={{
            backgroundColor: '#3b82f6',
            '&:hover': { backgroundColor: '#2563eb' },
            textTransform: 'none',
            fontSize: '0.85rem',
            py: 0.75,
            px: 2,
          }}
        >
          Add Company
        </Button>
      </Box>

      <Grid container spacing={1.5}>
        {companies.map((company) => (
          <Grid item xs={12} sm={6} md={4} key={company.id}>
            <Card
              sx={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: getTypeColor(company.source_type),
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                  <Box flex={1}>
                    <Box display="flex" alignItems="center" mb={0.5}>
                      <BusinessIcon sx={{ fontSize: '1rem', color: getTypeColor(company.source_type), mr: 0.5 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.95rem' }}>
                        {company.name}
                      </Typography>
                    </Box>
                    <Chip
                      label={company.source_type}
                      size="small"
                      sx={{
                        backgroundColor: `${getTypeColor(company.source_type)}20`,
                        color: getTypeColor(company.source_type),
                        textTransform: 'capitalize',
                        fontSize: '0.65rem',
                        height: '18px',
                      }}
                    />
                  </Box>
                </Box>

                {company.contact_person && (
                  <Box display="flex" alignItems="center" mb={0.5}>
                    <PersonIcon sx={{ fontSize: '0.85rem', color: '#94a3b8', mr: 0.5 }} />
                    <Typography variant="body2" sx={{ color: '#cbd5e1', fontSize: '0.75rem' }}>
                      {company.contact_person}
                    </Typography>
                  </Box>
                )}

                {company.contact_info && (
                  <Box display="flex" alignItems="center" mb={0.5}>
                    <EmailIcon sx={{ fontSize: '0.85rem', color: '#94a3b8', mr: 0.5 }} />
                    <Typography variant="body2" sx={{ color: '#cbd5e1', fontSize: '0.75rem' }}>
                      {company.contact_info}
                    </Typography>
                  </Box>
                )}

                {company.notes && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#64748b',
                      fontSize: '0.7rem',
                      fontStyle: 'italic',
                      mt: 0.5,
                      mb: 0.5,
                    }}
                  >
                    "{company.notes}"
                  </Typography>
                )}

                <Box display="flex" justifyContent="flex-end" gap={0.5} mt={1}>
                  <IconButton 
                    size="small" 
                    sx={{ color: '#94a3b8', padding: '4px' }}
                    onClick={() => handleOpenModal(company)}
                  >
                    <EditIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    sx={{ color: '#ef4444', padding: '4px' }}
                    onClick={() => handleDeleteCompany(company.id)}
                  >
                    <DeleteIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {companies.length === 0 && (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>
                No referral sources yet. Click "Add Company" to create your first one!
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Add/Edit Company Modal */}
      <Dialog 
        open={openModal} 
        onClose={() => setOpenModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
          }
        }}
      >
        <DialogTitle sx={{ color: '#f1f5f9', borderBottom: '1px solid #334155', py: 1.5 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography sx={{ fontSize: '1rem', fontWeight: 600 }}>
              {editingCompany ? 'Edit Company' : 'Add New Company'}
            </Typography>
            <IconButton onClick={() => setOpenModal(false)} sx={{ color: '#94a3b8', padding: '4px' }}>
              <CloseIcon sx={{ fontSize: '1.2rem' }} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 1 }}>
          <Grid container spacing={1.5}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                size="small"
                sx={{ 
                  '& .MuiOutlinedInput-root': { color: '#f1f5f9', fontSize: '0.85rem' },
                  '& .MuiInputLabel-root': { color: '#94a3b8', fontSize: '0.85rem' },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contact Person"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                size="small"
                sx={{ 
                  '& .MuiOutlinedInput-root': { color: '#f1f5f9', fontSize: '0.85rem' },
                  '& .MuiInputLabel-root': { color: '#94a3b8', fontSize: '0.85rem' },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contact Info (Email/Phone)"
                value={formData.contact_info}
                onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                size="small"
                sx={{ 
                  '& .MuiOutlinedInput-root': { color: '#f1f5f9', fontSize: '0.85rem' },
                  '& .MuiInputLabel-root': { color: '#94a3b8', fontSize: '0.85rem' },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Type"
                value={formData.source_type}
                onChange={(e) => setFormData({ ...formData, source_type: e.target.value })}
                size="small"
                sx={{ 
                  '& .MuiOutlinedInput-root': { color: '#f1f5f9', fontSize: '0.85rem' },
                  '& .MuiInputLabel-root': { color: '#94a3b8', fontSize: '0.85rem' },
                }}
              >
                <MenuItem value="hospital">Hospital</MenuItem>
                <MenuItem value="clinic">Clinic</MenuItem>
                <MenuItem value="community">Community</MenuItem>
                <MenuItem value="agency">Agency</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                size="small"
                sx={{ 
                  '& .MuiOutlinedInput-root': { color: '#f1f5f9', fontSize: '0.85rem' },
                  '& .MuiInputLabel-root': { color: '#94a3b8', fontSize: '0.85rem' },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #334155', p: 1.5 }}>
          <Button 
            onClick={() => setOpenModal(false)} 
            sx={{ color: '#94a3b8', fontSize: '0.85rem', py: 0.5 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveCompany}
            variant="contained"
            disabled={!formData.name}
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': { backgroundColor: '#2563eb' },
              fontSize: '0.85rem',
              py: 0.5,
            }}
          >
            {editingCompany ? 'Save Changes' : 'Add Company'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Companies;
