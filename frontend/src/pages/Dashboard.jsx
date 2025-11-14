import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PeopleIcon from '@mui/icons-material/People';
import TaskIcon from '@mui/icons-material/Task';

// Ultra-Compact KPI Card
const KPICard = ({ title, value, icon, color, subtitle }) => (
  <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155', height: '100%' }}>
    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box flex={1}>
          <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.65rem', mb: 0.25 }}>
            {title}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1.25rem', mb: 0.25, lineHeight: 1 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color, fontSize: '0.65rem' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}20`,
            borderRadius: 1,
            p: 0.75,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {React.cloneElement(icon, { sx: { color, fontSize: 20 } })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalDeals: 0,
    totalContacts: 0,
    pendingTasks: 0,
    deals: [],
    tasks: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dealsRes, tasksRes] = await Promise.all([
        fetch('/api/pipeline/leads', { credentials: 'include' }),
        fetch('/api/pipeline/tasks', { credentials: 'include' }),
      ]);

      const deals = dealsRes.ok ? await dealsRes.json() : [];
      const tasks = tasksRes.ok ? await tasksRes.json() : [];

      const totalRevenue = deals.reduce((sum, deal) => sum + (parseFloat(deal.expected_revenue) || 0), 0);
      const pendingTasks = tasks.filter(t => t.status === 'pending').length;

      setStats({
        totalRevenue,
        totalDeals: deals.length,
        totalContacts: 0,
        pendingTasks,
        deals,
        tasks,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 1 }}>
        <Typography sx={{ color: '#f1f5f9', fontSize: '0.8rem' }}>Loading...</Typography>
      </Container>
    );
  }

  const dealsByStage = stats.deals.reduce((acc, deal) => {
    const stageName = deal.stage_name || `Stage ${deal.stage_id}`;
    acc[stageName] = (acc[stageName] || 0) + 1;
    return acc;
  }, {});

  const stageData = Object.entries(dealsByStage).map(([name, value]) => ({ name, value }));

  const dealsByPriority = stats.deals.reduce((acc, deal) => {
    const priority = deal.priority || 'medium';
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, { high: 0, medium: 0, low: 0 });

  const priorityData = [
    { name: 'High', value: dealsByPriority.high, color: '#ef4444' },
    { name: 'Medium', value: dealsByPriority.medium, color: '#f59e0b' },
    { name: 'Low', value: dealsByPriority.low, color: '#22c55e' },
  ].filter(item => item.value > 0);

  const generateFutureMonths = () => {
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    
    for (let i = 0; i < 6; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthName = monthNames[futureDate.getMonth()];
      const projectedRevenue = Math.round((stats.totalRevenue / 6) * (1 + Math.random() * 0.3));
      months.push({ name: monthName, revenue: projectedRevenue });
    }
    
    return months;
  };

  const revenueData = generateFutureMonths();

  const revenueByStage = stats.deals.reduce((acc, deal) => {
    const stageName = deal.stage_name || `Stage ${deal.stage_id}`;
    acc[stageName] = (acc[stageName] || 0) + (parseFloat(deal.expected_revenue) || 0);
    return acc;
  }, {});

  return (
    <Container maxWidth="xl" sx={{ py: 1.5, px: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#f1f5f9', mb: 1.5, fontSize: '1.1rem' }}>
        Dashboard
      </Typography>

      {/* KPI Cards - Ultra Compact */}
      <Grid container spacing={1.5} mb={1.5}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon={<MonetizationOnIcon />}
            color="#22c55e"
            subtitle="Expected Monthly"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Active Deals"
            value={stats.totalDeals}
            icon={<TrendingUpIcon />}
            color="#3b82f6"
            subtitle={stageData.length > 0 ? `${stageData[0].value || 0} in first stage` : '0 deals'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Contacts"
            value={stats.totalContacts || 0}
            icon={<PeopleIcon />}
            color="#8b5cf6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Pending Tasks"
            value={stats.pendingTasks}
            icon={<TaskIcon />}
            color="#f59e0b"
            subtitle={`${stats.tasks.length} total tasks`}
          />
        </Grid>
      </Grid>

      {/* Charts Row - Ultra Compact */}
      <Grid container spacing={1.5} mb={1.5}>
        <Grid item xs={12} md={8}>
          <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="subtitle2" sx={{ color: '#f1f5f9', mb: 1, fontWeight: 600, fontSize: '0.85rem' }}>
                Projected Revenue (Next 6 Months)
              </Typography>
              {revenueData.some(d => d.revenue > 0) ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '0.7rem' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '0.7rem' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f1f5f9',
                        fontSize: '0.75rem',
                      }}
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                    Add deals to see revenue projections
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="subtitle2" sx={{ color: '#f1f5f9', mb: 1, fontWeight: 600, fontSize: '0.85rem' }}>
                Deals by Priority
              </Typography>
              {priorityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={50}
                      fill="#8884d8"
                      dataKey="value"
                      style={{ fontSize: '0.7rem' }}
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f1f5f9',
                        fontSize: '0.75rem',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                    No deals yet
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pipeline Overview - Ultra Compact */}
      <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Typography variant="subtitle2" sx={{ color: '#f1f5f9', mb: 1, fontWeight: 600, fontSize: '0.85rem' }}>
            Pipeline Overview
          </Typography>
          {stageData.length > 0 ? (
            <Grid container spacing={1.5}>
              {stageData.map((stage) => (
                <Grid item xs={12} sm={4} key={stage.name}>
                  <Box
                    sx={{
                      p: 1.5,
                      backgroundColor: '#0f172a',
                      borderRadius: 1.5,
                      border: '1px solid #334155',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.7rem', mb: 0.25 }}>
                      {stage.name}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#3b82f6', fontSize: '1.75rem', lineHeight: 1 }}>
                      {stage.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem' }}>
                      deals • ${Math.round(revenueByStage[stage.name] || 0).toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                No deals in pipeline yet. Click "Deals" to add your first lead!
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Dashboard;
