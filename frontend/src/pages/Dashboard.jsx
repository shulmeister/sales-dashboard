import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
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
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

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

  // Hot Deals (high priority or high revenue)
  const hotDeals = stats.deals
    .filter(d => d.priority === 'high' || (d.expected_revenue && d.expected_revenue > 5000))
    .slice(0, 4);

  // Upcoming Tasks (next 5)
  const upcomingTasks = stats.tasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date) - new Date(b.due_date);
    })
    .slice(0, 5);

  // Latest Activity (recent deals)
  const latestActivity = stats.deals.slice(-5).reverse();

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#22c55e';
      default: return '#94a3b8';
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 1.5, px: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#f1f5f9', mb: 1.5, fontSize: '1.1rem' }}>
        Dashboard
      </Typography>

      {/* KPI Cards */}
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

      <Grid container spacing={1.5}>
        {/* LEFT COLUMN - Hot Deals */}
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155', mb: 1.5, height: 'calc(100% - 12px)' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box display="flex" alignItems="center" mb={1}>
                <LocalFireDepartmentIcon sx={{ color: '#ef4444', fontSize: '1.1rem', mr: 0.5 }} />
                <Typography variant="subtitle2" sx={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.85rem' }}>
                  Hot Deals
                </Typography>
              </Box>
              {hotDeals.length > 0 ? (
                <List sx={{ p: 0 }}>
                  {hotDeals.map((deal, idx) => (
                    <React.Fragment key={deal.id}>
                      {idx > 0 && <Divider sx={{ borderColor: '#334155', my: 0.75 }} />}
                      <ListItem sx={{ p: 0, mb: 0.75 }}>
                        <ListItemAvatar sx={{ minWidth: 32 }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: getPriorityColor(deal.priority) }}>
                            {getInitials(deal.name)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#f1f5f9', mb: 0.25 }}>
                              {deal.name}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                                {deal.source}
                              </Typography>
                              <Typography sx={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 600 }}>
                                ${deal.expected_revenue?.toLocaleString() || 0}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography sx={{ color: '#64748b', fontSize: '0.75rem', textAlign: 'center', py: 2 }}>
                  No hot deals yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* CENTER COLUMN - Charts */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={1.5} mb={1.5}>
            <Grid item xs={12} md={8}>
              <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="subtitle2" sx={{ color: '#f1f5f9', mb: 1, fontWeight: 600, fontSize: '0.85rem' }}>
                    Projected Revenue (Next 6 Months)
                  </Typography>
                  {revenueData.some(d => d.revenue > 0) ? (
                    <ResponsiveContainer width="100%" height={140}>
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
                    <Box sx={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography sx={{ color: '#64748b', fontSize: '0.75rem' }}>
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
                    By Priority
                  </Typography>
                  {priorityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie
                          data={priorityData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={45}
                          fill="#8884d8"
                          dataKey="value"
                          style={{ fontSize: '0.65rem' }}
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
                    <Box sx={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                        No deals yet
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Latest Activity */}
          <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box display="flex" alignItems="center" mb={1}>
                <AccessTimeIcon sx={{ color: '#3b82f6', fontSize: '1.1rem', mr: 0.5 }} />
                <Typography variant="subtitle2" sx={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.85rem' }}>
                  Latest Activity
                </Typography>
              </Box>
              {latestActivity.length > 0 ? (
                <List sx={{ p: 0 }}>
                  {latestActivity.map((deal, idx) => (
                    <React.Fragment key={deal.id}>
                      {idx > 0 && <Divider sx={{ borderColor: '#334155', my: 0.5 }} />}
                      <ListItem sx={{ p: 0, py: 0.5 }}>
                        <ListItemText
                          primary={
                            <Typography sx={{ fontSize: '0.75rem', color: '#f1f5f9' }}>
                              New deal: <strong>{deal.name}</strong>
                            </Typography>
                          }
                          secondary={
                            <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                              {deal.source} • ${deal.expected_revenue?.toLocaleString() || 0}
                            </Typography>
                          }
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography sx={{ color: '#64748b', fontSize: '0.75rem', textAlign: 'center', py: 1 }}>
                  No activity yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT COLUMN - Upcoming Tasks */}
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155', mb: 1.5, height: 'calc(100% - 12px)' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box display="flex" alignItems="center" mb={1}>
                <CheckCircleOutlineIcon sx={{ color: '#22c55e', fontSize: '1.1rem', mr: 0.5 }} />
                <Typography variant="subtitle2" sx={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.85rem' }}>
                  Upcoming Tasks
                </Typography>
              </Box>
              {upcomingTasks.length > 0 ? (
                <List sx={{ p: 0 }}>
                  {upcomingTasks.map((task, idx) => (
                    <React.Fragment key={task.id}>
                      {idx > 0 && <Divider sx={{ borderColor: '#334155', my: 0.75 }} />}
                      <ListItem sx={{ p: 0, mb: 0.75, alignItems: 'flex-start' }}>
                        <ListItemText
                          primary={
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#f1f5f9', mb: 0.25 }}>
                              {task.description}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              {task.due_date && (
                                <Box display="flex" alignItems="center" mt={0.25}>
                                  <CalendarTodayIcon sx={{ fontSize: '0.65rem', color: '#94a3b8', mr: 0.25 }} />
                                  <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                                    {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </Typography>
                                </Box>
                              )}
                              <Chip
                                label={task.status}
                                size="small"
                                sx={{
                                  backgroundColor: `${task.status === 'pending' ? '#3b82f6' : '#f59e0b'}20`,
                                  color: task.status === 'pending' ? '#3b82f6' : '#f59e0b',
                                  fontSize: '0.6rem',
                                  height: '16px',
                                  mt: 0.5,
                                  textTransform: 'capitalize',
                                }}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography sx={{ color: '#64748b', fontSize: '0.75rem', textAlign: 'center', py: 2 }}>
                  No upcoming tasks
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pipeline Overview - Bottom */}
      <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155', mt: 1.5 }}>
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
