import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, Grid, Card, CardContent } from '@mui/material';

// KPI Card component matching the old dashboard style
const KPICard = ({ title, value, icon, color, subtitle }) => (
  <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155', height: '100%' }}>
    <CardContent sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
        <Box flex={1}>
          <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.75rem', mb: 0.5 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}20`,
            borderRadius: 1.5,
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
          }}
        >
          {icon}
        </Box>
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '2rem', mt: 1 }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const Summary = () => {
  const [stats, setStats] = useState({
    totalVisits: '-',
    totalCosts: '-',
    bonusesEarned: '-',
    costPerVisit: '-',
    emailsSent: '-',
    totalHours: '-',
  });

  useEffect(() => {
    fetchSummaryData();
  }, []);

  const fetchSummaryData = async () => {
    try {
      // Fetch dashboard summary from Google Sheets (via AnalyticsEngine)
      const summaryRes = await fetch('/api/dashboard/summary', { credentials: 'include' });
      
      if (summaryRes.ok) {
        const summary = await summaryRes.json();
        
        // Map the summary data to our stats
        setStats({
          totalVisits: (summary.total_visits || 0).toLocaleString(),
          totalCosts: `$${Math.round(summary.total_costs || 0).toLocaleString()}`,
          bonusesEarned: `$${Math.round(summary.total_bonuses || 0).toLocaleString()}`,
          costPerVisit: `$${Math.round(summary.cost_per_visit || 0).toLocaleString()}`,
          emailsSent: (summary.emails_sent_7_days || '-'),
          totalHours: Math.round(summary.total_hours || 0).toLocaleString(),
        });
      }
    } catch (error) {
      console.error('Error fetching summary data:', error);
      // Set error state with dashes
      setStats({
        totalVisits: '-',
        totalCosts: '-',
        bonusesEarned: '-',
        costPerVisit: '-',
        emailsSent: '-',
        totalHours: '-',
      });
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: '#f1f5f9', fontWeight: 600 }}>
        Sales Dashboard Summary
      </Typography>

      {/* KPI Grid */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <KPICard
            title="Total Visits"
            value={stats.totalVisits}
            icon="📊"
            color="#3b82f6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KPICard
            title="Total Costs"
            subtitle="Excluding Bonuses"
            value={stats.totalCosts}
            icon="💰"
            color="#ef4444"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KPICard
            title="Bonuses Earned"
            value={stats.bonusesEarned}
            icon="🏆"
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KPICard
            title="Cost Per Visit"
            value={stats.costPerVisit}
            icon="📈"
            color="#8b5cf6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KPICard
            title="Emails Sent"
            subtitle="Last 7 Days"
            value={stats.emailsSent}
            icon="📧"
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KPICard
            title="Total Hours"
            value={stats.totalHours}
            icon="⏰"
            color="#06b6d4"
          />
        </Grid>
      </Grid>

      {/* Additional Info */}
      <Box sx={{ backgroundColor: '#1e293b', p: 3, borderRadius: 2, border: '1px solid #334155', mt: 3 }}>
        <Typography variant="h6" sx={{ color: '#f1f5f9', mb: 2, fontWeight: 600 }}>
          Quick Stats
        </Typography>
        <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.6 }}>
          This summary shows your key performance metrics across all sales activities.
          Visit the other tabs to view detailed visits, manage uploads, or check activity logs.
        </Typography>
      </Box>
    </Container>
  );
};

export default Summary;

