import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  IconButton,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const Tasks = () => {
  const [tasks] = useState([
    {
      id: 1,
      title: 'Follow up with John Smith',
      description: 'Call to discuss care options',
      status: 'pending',
      priority: 'high',
      due_date: '2024-11-15',
      assigned_to: 'Sarah',
    },
    {
      id: 2,
      title: 'Schedule assessment for Mary Johnson',
      description: 'Home visit for care assessment',
      status: 'pending',
      priority: 'high',
      due_date: '2024-11-16',
      assigned_to: 'Mike',
    },
    {
      id: 3,
      title: 'Send contract to Robert Davis',
      description: 'Email service agreement',
      status: 'in_progress',
      priority: 'medium',
      due_date: '2024-11-17',
      assigned_to: 'Sarah',
    },
    {
      id: 4,
      title: 'Update referral source database',
      description: 'Add new hospital contacts',
      status: 'pending',
      priority: 'low',
      due_date: '2024-11-20',
      assigned_to: 'Admin',
    },
    {
      id: 5,
      title: 'Prepare monthly report',
      description: 'Sales and lead metrics',
      status: 'completed',
      priority: 'medium',
      due_date: '2024-11-10',
      assigned_to: 'Manager',
    },
  ]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#22c55e';
      default: return '#94a3b8';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#22c55e';
      case 'in_progress': return '#3b82f6';
      case 'pending': return '#94a3b8';
      default: return '#94a3b8';
    }
  };

  const filterTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#f1f5f9' }}>
          Tasks
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
          Add Task
        </Button>
      </Box>

      {/* Task Columns */}
      <Grid container spacing={3}>
        {/* Pending Tasks */}
        <Grid item xs={12} md={4}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#f1f5f9', fontWeight: 600 }}>
              Pending
              <Chip
                label={filterTasksByStatus('pending').length}
                size="small"
                sx={{ ml: 1, backgroundColor: '#94a3b820', color: '#94a3b8' }}
              />
            </Typography>
          </Box>
          <Box display="flex" flexDirection="column" gap={2}>
            {filterTasksByStatus('pending').map((task) => (
              <Card
                key={task.id}
                sx={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="start" gap={1} mb={2}>
                    <Checkbox sx={{ color: '#94a3b8', p: 0, mt: 0.5 }} />
                    <Box flex={1}>
                      <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, color: '#f1f5f9', mb: 1 }}>
                        {task.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                        {task.description}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <CalendarTodayIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                          {new Date(task.due_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={1} mb={2}>
                        <Chip
                          label={task.priority}
                          size="small"
                          sx={{
                            backgroundColor: `${getPriorityColor(task.priority)}20`,
                            color: getPriorityColor(task.priority),
                            textTransform: 'capitalize',
                          }}
                        />
                        <Chip
                          label={task.assigned_to}
                          size="small"
                          sx={{
                            backgroundColor: '#3b82f620',
                            color: '#3b82f6',
                          }}
                        />
                      </Box>
                      <Box display="flex" justifyContent="flex-end" gap={0.5}>
                        <IconButton size="small" sx={{ color: '#94a3b8' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" sx={{ color: '#ef4444' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Grid>

        {/* In Progress Tasks */}
        <Grid item xs={12} md={4}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#f1f5f9', fontWeight: 600 }}>
              In Progress
              <Chip
                label={filterTasksByStatus('in_progress').length}
                size="small"
                sx={{ ml: 1, backgroundColor: '#3b82f620', color: '#3b82f6' }}
              />
            </Typography>
          </Box>
          <Box display="flex" flexDirection="column" gap={2}>
            {filterTasksByStatus('in_progress').map((task) => (
              <Card
                key={task.id}
                sx={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #3b82f6',
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="start" gap={1} mb={2}>
                    <Checkbox sx={{ color: '#3b82f6', p: 0, mt: 0.5 }} />
                    <Box flex={1}>
                      <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, color: '#f1f5f9', mb: 1 }}>
                        {task.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                        {task.description}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <CalendarTodayIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                          {new Date(task.due_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={1} mb={2}>
                        <Chip
                          label={task.priority}
                          size="small"
                          sx={{
                            backgroundColor: `${getPriorityColor(task.priority)}20`,
                            color: getPriorityColor(task.priority),
                            textTransform: 'capitalize',
                          }}
                        />
                        <Chip
                          label={task.assigned_to}
                          size="small"
                          sx={{
                            backgroundColor: '#3b82f620',
                            color: '#3b82f6',
                          }}
                        />
                      </Box>
                      <Box display="flex" justifyContent="flex-end" gap={0.5}>
                        <IconButton size="small" sx={{ color: '#94a3b8' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" sx={{ color: '#ef4444' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Grid>

        {/* Completed Tasks */}
        <Grid item xs={12} md={4}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#f1f5f9', fontWeight: 600 }}>
              Completed
              <Chip
                label={filterTasksByStatus('completed').length}
                size="small"
                sx={{ ml: 1, backgroundColor: '#22c55e20', color: '#22c55e' }}
              />
            </Typography>
          </Box>
          <Box display="flex" flexDirection="column" gap={2}>
            {filterTasksByStatus('completed').map((task) => (
              <Card
                key={task.id}
                sx={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #22c55e',
                  opacity: 0.7,
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="start" gap={1} mb={2}>
                    <Checkbox checked sx={{ color: '#22c55e', p: 0, mt: 0.5 }} />
                    <Box flex={1}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontSize: '1rem',
                          fontWeight: 600,
                          color: '#f1f5f9',
                          mb: 1,
                          textDecoration: 'line-through',
                        }}
                      >
                        {task.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                        {task.description}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <CalendarTodayIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                          {new Date(task.due_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={1} mb={2}>
                        <Chip
                          label={task.priority}
                          size="small"
                          sx={{
                            backgroundColor: `${getPriorityColor(task.priority)}20`,
                            color: getPriorityColor(task.priority),
                            textTransform: 'capitalize',
                          }}
                        />
                        <Chip
                          label={task.assigned_to}
                          size="small"
                          sx={{
                            backgroundColor: '#3b82f620',
                            color: '#3b82f6',
                          }}
                        />
                      </Box>
                      <Box display="flex" justifyContent="flex-end" gap={0.5}>
                        <IconButton size="small" sx={{ color: '#94a3b8' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" sx={{ color: '#ef4444' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Tasks;

