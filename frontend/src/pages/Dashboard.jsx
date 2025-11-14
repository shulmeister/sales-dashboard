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

// Compact KPI Card Component
const KPICard = ({ title, value, icon, color, subtitle }) => (
  <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155', height: '100%' }}>
    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box flex={1}>
          <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.75rem', mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1.5rem', mb: 0.25 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color, fontSize: '0.7rem' }}>
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
          }}
        >
          {React.cloneElement(icon, { sx: { color, fontSize: 24 } })}
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
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data from API
    const fetchData = async () => {
      try {
        const [dealsRes, tasksRes] = await Promise.all([
          fetch('/api/pipeline/leads', { credentials: 'include' }),
          fetch('/api/pipeline/tasks', { credentials: 'include' }),
        ]);

        if (dealsRes.ok && tasksRes.ok) {
          const deals = await dealsRes.json();
          const tasks = await tasksRes.json();

          const totalRevenue = deals.reduce((sum, deal) => sum + (parseFloat(deal.expected_revenue) || 0), 0);
          const pendingTasks = tasks.filter(t => t.status === 'pending').length;

          setStats({
            totalRevenue,
            totalDeals: deals.length,
            totalContacts: 0,
            pendingTasks,
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Sample data for charts
  const stageData = [
    { name: 'Incoming', value: 12 },
    { name: 'Ongoing', value: 8 },
    { name: 'Closed', value: 5 },
  ];

  const priorityData = [
    { name: 'High', value: 6, color: '#ef4444' },
    { name: 'Medium', value: 10, color: '#f59e0b' },
    { name: 'Low', value: 9, color: '#22c55e' },
  ];

  const revenueData = [
    { name: 'Jan', revenue: 12000 },
    { name: 'Feb', revenue: 19000 },
    { name: 'Mar', revenue: 15000 },
    { name: 'Apr', revenue: 25000 },
    { name: 'May', revenue: 22000 },
    { name: 'Jun', revenue: 30000 },
  ];

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Typography sx={{ color: '#f1f5f9', fontSize: '0.9rem' }}>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 2, px: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: '#f1f5f9', mb: 2 }}>
        Dashboard
      </Typography>

      {/* KPI Cards - Compact */}
      <Grid container spacing={2} mb={2}>
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
            subtitle={`${stageData[0].value} new this month`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Contacts"
            value={stats.totalContacts || 25}
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
            subtitle={`${stats.pendingTasks + 5} total tasks`}
          />
        </Grid>
      </Grid>

      {/* Charts Row - More Compact */}
      <Grid container spacing={2} mb={2}>
        {/* Revenue Chart */}
        <Grid item xs={12} md={8}>
          <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="subtitle1" sx={{ color: '#f1f5f9', mb: 1.5, fontWeight: 600, fontSize: '0.95rem' }}>
                Revenue by Month
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '0.75rem' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '0.75rem' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                      fontSize: '0.8rem',
                    }}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Priority Pie Chart */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="subtitle1" sx={{ color: '#f1f5f9', mb: 1.5, fontWeight: 600, fontSize: '0.95rem' }}>
                Deals by Priority
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    style={{ fontSize: '0.75rem' }}
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                      fontSize: '0.8rem',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pipeline Overview - Compact */}
      <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="subtitle1" sx={{ color: '#f1f5f9', mb: 1.5, fontWeight: 600, fontSize: '0.95rem' }}>
            Pipeline Overview
          </Typography>
          <Grid container spacing={2}>
            {stageData.map((stage) => (
              <Grid item xs={12} sm={4} key={stage.name}>
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: '#0f172a',
                    borderRadius: 2,
                    border: '1px solid #334155',
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.75rem', mb: 0.5 }}>
                    {stage.name} Leads
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#3b82f6', fontSize: '2rem' }}>
                    {stage.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                    deals in stage
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Dashboard;
