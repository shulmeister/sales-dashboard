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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

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

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch deals from API
    const fetchDeals = async () => {
      try {
        const response = await fetch('/api/pipeline/leads', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            setDeals(data);
          }
        }
      } catch (error) {
        console.log('Using sample data for now');
      }
    };

    fetchDeals();
  }, []);

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

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#f1f5f9' }}>
          Deals Pipeline
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
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
                      {/* Deal Header */}
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

                      {/* Deal Info */}
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

                      {/* Notes */}
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

                      {/* Revenue & Actions */}
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
                          <IconButton size="small" sx={{ color: '#ef4444' }}>
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
    </Container>
  );
};

export default Deals;

