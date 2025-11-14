import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
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

// KPI Card Component
const KPICard = ({ title, value, icon, color, subtitle }) => (
  <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155', height: '100%' }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ color: '#94a3b8' }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#f1f5f9', mb: 1 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}20`,
            borderRadius: 2,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {React.cloneElement(icon, { sx: { color, fontSize: 32 } })}
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
    contacts: [],
    tasks: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data from API
    const fetchData = async () => {
      try {
        const [dealsRes, contactsRes, tasksRes] = await Promise.all([
          fetch('/api/pipeline/leads', { credentials: 'include' }),
          fetch('/api/contacts', { credentials: 'include' }),
          fetch('/api/pipeline/tasks', { credentials: 'include' }),
        ]);

        const deals = await dealsRes.json();
        const contacts = await contactsRes.json();
        const tasks = await tasksRes.json();

        const totalRevenue = deals.reduce((sum, deal) => sum + (parseFloat(deal.expected_revenue) || 0), 0);
        const pendingTasks = tasks.filter(t => t.status === 'pending').length;

        setStats({
          totalRevenue,
          totalDeals: deals.length,
          totalContacts: contacts.length,
          pendingTasks,
          deals,
          contacts,
          tasks,
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box p={3}>
        <Typography sx={{ color: '#f1f5f9' }}>Loading dashboard...</Typography>
      </Box>
    );
  }

  // Deals by stage
  const dealsByStage = stats.deals.reduce((acc, deal) => {
    const stageName = deal.stage_name || 'Unknown';
    acc[stageName] = (acc[stageName] || 0) + 1;
    return acc;
  }, {});

  const stageData = Object.entries(dealsByStage).map(([name, value]) => ({
    name,
    value,
  }));

  // Deals by priority
  const dealsByPriority = stats.deals.reduce((acc, deal) => {
    const priority = deal.priority || 'medium';
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {});

  const priorityData = [
    { name: 'High', value: dealsByPriority.high || 0, color: '#ef4444' },
    { name: 'Medium', value: dealsByPriority.medium || 0, color: '#f59e0b' },
    { name: 'Low', value: dealsByPriority.low || 0, color: '#22c55e' },
  ];

  // Revenue by stage
  const revenueByStage = stats.deals.reduce((acc, deal) => {
    const stageName = deal.stage_name || 'Unknown';
    acc[stageName] = (acc[stageName] || 0) + (parseFloat(deal.expected_revenue) || 0);
    return acc;
  }, {});

  const revenueData = Object.entries(revenueByStage).map(([name, value]) => ({
    name,
    revenue: Math.round(value),
  }));

  return (
    <Box p={3} sx={{ backgroundColor: '#0f172a', minHeight: 'calc(100vh - 64px)' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#f1f5f9', mb: 3 }}>
        Dashboard
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} mb={4}>
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
            subtitle={`${stats.deals.filter(d => d.stage_name === 'Incoming Leads').length || 0} new`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Contacts"
            value={stats.totalContacts}
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
            subtitle={`${stats.tasks.length || 0} total`}
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Revenue by Stage */}
        <Grid item xs={12} md={8}>
          <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
            <CardHeader
              title="Revenue by Pipeline Stage"
              sx={{ 
                color: '#f1f5f9', 
                '& .MuiCardHeader-title': { fontWeight: 600, color: '#f1f5f9' },
                borderBottom: '1px solid #334155',
              }}
            />
            <CardContent>
              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#f1f5f9',
                      }}
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography sx={{ color: '#94a3b8', textAlign: 'center', py: 4 }}>
                  No revenue data yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Deals by Priority */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
            <CardHeader
              title="Deals by Priority"
              sx={{ 
                color: '#f1f5f9', 
                '& .MuiCardHeader-title': { fontWeight: 600, color: '#f1f5f9' },
                borderBottom: '1px solid #334155',
              }}
            />
            <CardContent>
              {priorityData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={priorityData.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
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
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography sx={{ color: '#94a3b8', textAlign: 'center', py: 4 }}>
                  No deals yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Pipeline Overview */}
        {stageData.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
              <CardHeader
                title="Pipeline Overview"
                sx={{ 
                  color: '#f1f5f9', 
                  '& .MuiCardHeader-title': { fontWeight: 600, color: '#f1f5f9' },
                  borderBottom: '1px solid #334155',
                }}
              />
              <CardContent>
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
                        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ color: '#94a3b8' }}>
                          {stage.name}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#3b82f6' }}>
                          {stage.value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ color: '#64748b' }}>
                          deals in stage
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard;
