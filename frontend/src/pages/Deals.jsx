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

const Deals = () => {
  const [stages, setStages] = useState([
    { id: 1, name: 'Incoming Leads', color: '#3b82f6', weighting: 0.10 },
    { id: 2, name: 'Ongoing Leads', color: '#f59e0b', weighting: 0.40 },
    { id: 3, name: 'Pending', color: '#8b5cf6', weighting: 0.80 },
    { id: 4, name: 'Closed/Won', color: '#22c55e', weighting: 1.00 },
  ]);

  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_info: '',
    source: '',
    payor_source: '',
    expected_revenue: '',
    priority: 'medium',
    notes: '',
    stage_id: 1,
  });

  // Fetch deals from API
  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const response = await fetch('/api/pipeline/leads', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setDeals(data);
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDealsByStage = (stageId) => {
    return deals.filter(deal => deal.stage_id === stageId);
  };

  const getWeightedRevenue = (deal, stage) => {
    const revenue = parseFloat(deal.expected_revenue) || 0;
    const weighting = stage.weighting || 1;
    return revenue * weighting;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#22c55e';
      default: return '#94a3b8';
    }
  };

  const handleOpenModal = (deal = null) => {
    if (deal) {
      setEditingDeal(deal);
      setFormData({
        name: deal.name || '',
        contact_info: deal.contact_info || '',
        source: deal.source || '',
        payor_source: deal.payor_source || '',
        expected_revenue: deal.expected_revenue || '',
        priority: deal.priority || 'medium',
        notes: deal.notes || '',
        stage_id: deal.stage_id || 1,
      });
    } else {
      setEditingDeal(null);
      setFormData({
        name: '',
        contact_info: '',
        source: '',
        payor_source: '',
        expected_revenue: '',
        priority: 'medium',
        notes: '',
        stage_id: 1,
      });
    }
    setOpenModal(true);
  };

  const handleSaveDeal = async () => {
    try {
      const url = editingDeal 
        ? `/api/pipeline/leads/${editingDeal.id}`
        : '/api/pipeline/leads';
      
      const method = editingDeal ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          expected_revenue: parseFloat(formData.expected_revenue) || 0,
        }),
      });

      if (response.ok) {
        fetchDeals(); // Refresh the list
        setOpenModal(false);
      }
    } catch (error) {
      console.error('Error saving deal:', error);
    }
  };

  const handleDeleteDeal = async (dealId) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;
    
    try {
      const response = await fetch(`/api/pipeline/leads/${dealId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchDeals(); // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting deal:', error);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 1.5 }}>
        <Typography sx={{ color: '#f1f5f9', fontSize: '0.8rem' }}>Loading deals...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 1.5 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1.1rem' }}>
          Deals Pipeline
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
          Add Deal
        </Button>
      </Box>

      {/* Kanban Board - 4 columns */}
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
        {stages.map((stage) => (
          <Box
            key={stage.id}
            sx={{
              minWidth: 380,
              maxWidth: 380,
              backgroundColor: '#1e293b',
              borderRadius: 2,
              border: '1px solid #334155',
              p: 1.5,
              minHeight: '600px',
              flexShrink: 0,
            }}
          >
              {/* Column Header */}
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1.5}
                pb={1}
                borderBottom="1px solid #334155"
              >
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.9rem' }}>
                    {stage.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem' }}>
                    {stage.weighting * 100}% weighted
                  </Typography>
                </Box>
                <Chip
                  label={getDealsByStage(stage.id).length}
                  size="small"
                  sx={{
                    backgroundColor: `${stage.color}20`,
                    color: stage.color,
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: '18px',
                  }}
                />
              </Box>

              {/* Deals */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {getDealsByStage(stage.id).map((deal) => (
                  <Card
                    key={deal.id}
                    sx={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: stage.color,
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.85rem' }}>
                          {deal.name}
                        </Typography>
                        <Chip
                          label={deal.priority}
                          size="small"
                          sx={{
                            backgroundColor: `${getPriorityColor(deal.priority)}20`,
                            color: getPriorityColor(deal.priority),
                            textTransform: 'capitalize',
                            fontSize: '0.65rem',
                            height: '18px',
                          }}
                        />
                      </Box>

                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 0.25, fontSize: '0.75rem' }}>
                          📞 {deal.contact_info}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 0.25, fontSize: '0.75rem' }}>
                          📍 {deal.source}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                          💳 {deal.payor_source}
                        </Typography>
                      </Box>

                      {deal.notes && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#64748b',
                            fontSize: '0.7rem',
                            fontStyle: 'italic',
                            mb: 1,
                          }}
                        >
                          "{deal.notes}"
                        </Typography>
                      )}

                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#22c55e', fontSize: '0.95rem' }}>
                            ${getWeightedRevenue(deal, stage).toLocaleString()}
                          </Typography>
                          {stage.weighting < 1 && (
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem' }}>
                              of ${deal.expected_revenue?.toLocaleString() || 0}
                            </Typography>
                          )}
                        </Box>
                        <Box>
                          <IconButton 
                            size="small" 
                            sx={{ color: '#94a3b8', padding: '4px' }}
                            onClick={() => handleOpenModal(deal)}
                          >
                            <EditIcon sx={{ fontSize: '1rem' }} />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            sx={{ color: '#ef4444', padding: '4px' }}
                            onClick={() => handleDeleteDeal(deal.id)}
                          >
                            <DeleteIcon sx={{ fontSize: '1rem' }} />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
          </Box>
        ))}
      </Box>

      {/* Add/Edit Deal Modal */}
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
              {editingDeal ? 'Edit Deal' : 'Add New Deal'}
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
                label="Name"
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
                label="Contact Info"
                value={formData.contact_info}
                onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                size="small"
                sx={{ 
                  '& .MuiOutlinedInput-root': { color: '#f1f5f9', fontSize: '0.85rem' },
                  '& .MuiInputLabel-root': { color: '#94a3b8', fontSize: '0.85rem' },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                size="small"
                sx={{ 
                  '& .MuiOutlinedInput-root': { color: '#f1f5f9', fontSize: '0.85rem' },
                  '& .MuiInputLabel-root': { color: '#94a3b8', fontSize: '0.85rem' },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Payor Source"
                value={formData.payor_source}
                onChange={(e) => setFormData({ ...formData, payor_source: e.target.value })}
                size="small"
                sx={{ 
                  '& .MuiOutlinedInput-root': { color: '#f1f5f9', fontSize: '0.85rem' },
                  '& .MuiInputLabel-root': { color: '#94a3b8', fontSize: '0.85rem' },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Expected Revenue"
                type="number"
                value={formData.expected_revenue}
                onChange={(e) => setFormData({ ...formData, expected_revenue: e.target.value })}
                size="small"
                sx={{ 
                  '& .MuiOutlinedInput-root': { color: '#f1f5f9', fontSize: '0.85rem' },
                  '& .MuiInputLabel-root': { color: '#94a3b8', fontSize: '0.85rem' },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                size="small"
                sx={{ 
                  '& .MuiOutlinedInput-root': { color: '#f1f5f9', fontSize: '0.85rem' },
                  '& .MuiInputLabel-root': { color: '#94a3b8', fontSize: '0.85rem' },
                }}
              >
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Stage"
                value={formData.stage_id}
                onChange={(e) => setFormData({ ...formData, stage_id: e.target.value })}
                size="small"
                sx={{ 
                  '& .MuiOutlinedInput-root': { color: '#f1f5f9', fontSize: '0.85rem' },
                  '& .MuiInputLabel-root': { color: '#94a3b8', fontSize: '0.85rem' },
                }}
              >
                {stages.map(stage => (
                  <MenuItem key={stage.id} value={stage.id}>
                    {stage.name} ({stage.weighting * 100}% weighted)
                  </MenuItem>
                ))}
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
            onClick={handleSaveDeal}
            variant="contained"
            disabled={!formData.name || !formData.contact_info}
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': { backgroundColor: '#2563eb' },
              fontSize: '0.85rem',
              py: 0.5,
            }}
          >
            {editingDeal ? 'Save Changes' : 'Add Deal'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Deals;
