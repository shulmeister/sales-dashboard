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
    { id: 1, name: 'Incoming Leads', color: '#3b82f6' },
    { id: 2, name: 'Ongoing Leads', color: '#f59e0b' },
    { id: 3, name: 'Closed/Won', color: '#22c55e' },
  ]);

  const [deals, setDeals] = useState([
    {
      id: 1,
      stage_id: 1,
      name: 'John Smith',
      contact_info: 'john@example.com',
      source: 'Website',
      payor_source: 'Medicare',
      expected_revenue: 5000,
      priority: 'high',
      notes: 'Interested in home care services',
    },
    {
      id: 2,
      stage_id: 1,
      name: 'Mary Johnson',
      contact_info: '(555) 123-4567',
      source: 'Referral',
      payor_source: 'Private Pay',
      expected_revenue: 3500,
      priority: 'medium',
      notes: 'Needs evening care',
    },
    {
      id: 3,
      stage_id: 2,
      name: 'Robert Davis',
      contact_info: 'robert.d@email.com',
      source: 'Social Media',
      payor_source: 'Medicaid',
      expected_revenue: 4200,
      priority: 'high',
      notes: 'Assessment scheduled for next week',
    },
  ]);

  const [openModal, setOpenModal] = useState(false);
  const [newDeal, setNewDeal] = useState({
    name: '',
    contact_info: '',
    source: '',
    payor_source: '',
    expected_revenue: '',
    priority: 'medium',
    notes: '',
    stage_id: 1,
  });

  const getDealsByStage = (stageId) => {
    return deals.filter(deal => deal.stage_id === stageId);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#22c55e';
      default: return '#94a3b8';
    }
  };

  const handleAddDeal = () => {
    const dealToAdd = {
      ...newDeal,
      id: Math.max(...deals.map(d => d.id), 0) + 1,
      expected_revenue: parseFloat(newDeal.expected_revenue) || 0,
    };
    
    setDeals([...deals, dealToAdd]);
    setOpenModal(false);
    setNewDeal({
      name: '',
      contact_info: '',
      source: '',
      payor_source: '',
      expected_revenue: '',
      priority: 'medium',
      notes: '',
      stage_id: 1,
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#f1f5f9' }}>
          Deals Pipeline
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenModal(true)}
          sx={{
            backgroundColor: '#3b82f6',
            '&:hover': { backgroundColor: '#2563eb' },
            textTransform: 'none',
          }}
        >
          Add Deal
        </Button>
      </Box>

      {/* Kanban Board */}
      <Grid container spacing={3}>
        {stages.map((stage) => (
          <Grid item xs={12} md={4} key={stage.id}>
            <Box
              sx={{
                backgroundColor: '#1e293b',
                borderRadius: 2,
                border: '1px solid #334155',
                p: 2,
                minHeight: '600px',
              }}
            >
              {/* Column Header */}
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
                pb={2}
                borderBottom="1px solid #334155"
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, color: '#f1f5f9' }}
                >
                  {stage.name}
                </Typography>
                <Chip
                  label={getDealsByStage(stage.id).length}
                  size="small"
                  sx={{
                    backgroundColor: `${stage.color}20`,
                    color: stage.color,
                    fontWeight: 600,
                  }}
                />
              </Box>

              {/* Deals */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 600, color: '#f1f5f9', fontSize: '1rem' }}
                        >
                          {deal.name}
                        </Typography>
                        <Chip
                          label={deal.priority}
                          size="small"
                          sx={{
                            backgroundColor: `${getPriorityColor(deal.priority)}20`,
                            color: getPriorityColor(deal.priority),
                            textTransform: 'capitalize',
                            fontSize: '0.7rem',
                            height: '20px',
                          }}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 0.5 }}>
                          📞 {deal.contact_info}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 0.5 }}>
                          📍 {deal.source}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                          💳 {deal.payor_source}
                        </Typography>
                      </Box>

                      {deal.notes && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#64748b',
                            fontSize: '0.85rem',
                            fontStyle: 'italic',
                            mb: 2,
                          }}
                        >
                          "{deal.notes}"
                        </Typography>
                      )}

                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, color: '#22c55e', fontSize: '1.1rem' }}
                        >
                          ${deal.expected_revenue?.toLocaleString() || 0}
                        </Typography>
                        <Box>
                          <IconButton size="small" sx={{ color: '#94a3b8' }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            sx={{ color: '#ef4444' }}
                            onClick={() => setDeals(deals.filter(d => d.id !== deal.id))}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Add Deal Modal */}
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
        <DialogTitle sx={{ color: '#f1f5f9', borderBottom: '1px solid #334155' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Add New Deal
            <IconButton onClick={() => setOpenModal(false)} sx={{ color: '#94a3b8' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={newDeal.name}
                onChange={(e) => setNewDeal({ ...newDeal, name: e.target.value })}
                sx={{ 
                  '& .MuiOutlinedInput-root': { color: '#f1f5f9' },
                  '& .MuiInputLabel-root': { color: '#94a3b8' },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contact Info"
                value={newDeal.contact_info}
                onChange={(e) => setNewDeal({ ...newDeal, contact_info: e.target.value })}
                sx={{ 
                  '& .MuiOutlinedInput-root': { color: '#f1f5f9' },
                  '& .MuiInputLabel-root': { color: '#94a3b8' },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Source"
                value={newDeal.source}
                onChange={(e) => setNewDeal({ ...newDeal, source: e.target.value })}
                sx={{ 
                  '& .MuiOutlinedInput-root': { color: '#f1f5f9' },
                  '& .MuiInputLabel-root': { color: '#94a3b8' },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Payor Source"
                value={newDeal.payor_source}
                onChange={(e) => setNewDeal({ ...newDeal, payor_source: e.target.value })}
                sx={{ 
                  '& .MuiOutlinedInput-root': { color: '#f1f5f9' },
                  '& .MuiInputLabel-root': { color: '#94a3b8' },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Expected Revenue"
                type="number"
                value={newDeal.expected_revenue}
                onChange={(e) => setNewDeal({ ...newDeal, expected_revenue: e.target.value })}
                sx={{ 
                  '& .MuiOutlinedInput-root': { color: '#f1f5f9' },
                  '& .MuiInputLabel-root': { color: '#94a3b8' },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Priority"
                value={newDeal.priority}
                onChange={(e) => setNewDeal({ ...newDeal, priority: e.target.value })}
                sx={{ 
                  '& .MuiOutlinedInput-root': { color: '#f1f5f9' },
                  '& .MuiInputLabel-root': { color: '#94a3b8' },
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
                multiline
                rows={3}
                label="Notes"
                value={newDeal.notes}
                onChange={(e) => setNewDeal({ ...newDeal, notes: e.target.value })}
                sx={{ 
                  '& .MuiOutlinedInput-root': { color: '#f1f5f9' },
                  '& .MuiInputLabel-root': { color: '#94a3b8' },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #334155', p: 2 }}>
          <Button onClick={() => setOpenModal(false)} sx={{ color: '#94a3b8' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddDeal}
            variant="contained"
            disabled={!newDeal.name || !newDeal.contact_info}
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': { backgroundColor: '#2563eb' },
            }}
          >
            Add Deal
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Deals;
