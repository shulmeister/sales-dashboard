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
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    lead_id: '',
    description: '',
    due_date: '',
    status: 'pending',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, dealsRes] = await Promise.all([
        fetch('/api/pipeline/tasks', { credentials: 'include' }),
        fetch('/api/pipeline/leads', { credentials: 'include' }),
      ]);

      const tasksData = tasksRes.ok ? await tasksRes.json() : [];
      const dealsData = dealsRes.ok ? await dealsRes.json() : [];

      setTasks(tasksData);
      setDeals(dealsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#22c55e';
      case 'in_progress': return '#f59e0b';
      case 'pending': return '#3b82f6';
      default: return '#94a3b8';
    }
  };

  const groupTasksByStatus = () => {
    return {
      pending: tasks.filter(t => t.status === 'pending'),
      in_progress: tasks.filter(t => t.status === 'in_progress'),
      completed: tasks.filter(t => t.status === 'completed'),
    };
  };

  const handleOpenModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        lead_id: task.lead_id || '',
        description: task.description || '',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        status: task.status || 'pending',
      });
    } else {
      setEditingTask(null);
      setFormData({
        lead_id: '',
        description: '',
        due_date: '',
        status: 'pending',
      });
    }
    setOpenModal(true);
  };

  const handleSaveTask = async () => {
    try {
      const url = editingTask 
        ? `/api/pipeline/tasks/${editingTask.id}`
        : '/api/pipeline/tasks';
      
      const method = editingTask ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          lead_id: formData.lead_id ? parseInt(formData.lead_id) : null,
        }),
      });

      if (response.ok) {
        fetchData();
        setOpenModal(false);
      }
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const response = await fetch(`/api/pipeline/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      const response = await fetch(`/api/pipeline/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...task, status: newStatus }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const getDealName = (leadId) => {
    const deal = deals.find(d => d.id === leadId);
    return deal ? deal.name : 'No Deal';
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 1.5 }}>
        <Typography sx={{ color: '#f1f5f9', fontSize: '0.8rem' }}>Loading tasks...</Typography>
      </Container>
    );
  }

  const groupedTasks = groupTasksByStatus();

  return (
    <Container maxWidth="xl" sx={{ py: 1.5 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1.1rem' }}>
          Tasks Board
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
          Add Task
        </Button>
      </Box>

      <Grid container spacing={1.5}>
        {Object.entries(groupedTasks).map(([status, statusTasks]) => (
          <Grid item xs={12} md={4} key={status}>
            <Box
              sx={{
                backgroundColor: '#1e293b',
                borderRadius: 2,
                border: '1px solid #334155',
                p: 1.5,
                minHeight: '500px',
              }}
            >
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1.5}
                pb={1}
                borderBottom="1px solid #334155"
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.9rem', textTransform: 'capitalize' }}>
                  {status.replace('_', ' ')}
                </Typography>
                <Chip
                  label={statusTasks.length}
                  size="small"
                  sx={{
                    backgroundColor: `${getStatusColor(status)}20`,
                    color: getStatusColor(status),
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: '18px',
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {statusTasks.map((task) => (
                  <Card
                    key={task.id}
                    sx={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      opacity: task.status === 'completed' ? 0.7 : 1,
                    }}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box display="flex" alignItems="start" mb={1}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleToggleStatus(task)}
                          sx={{ color: getStatusColor(task.status), padding: '2px', mr: 0.5 }}
                        >
                          {task.status === 'completed' ? (
                            <CheckCircleIcon sx={{ fontSize: '1.2rem' }} />
                          ) : (
                            <RadioButtonUncheckedIcon sx={{ fontSize: '1.2rem' }} />
                          )}
                        </IconButton>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 600, 
                            color: '#f1f5f9', 
                            fontSize: '0.85rem',
                            textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                            flex: 1,
                          }}
                        >
                          {task.description}
                        </Typography>
                      </Box>

                      <Box display="flex" alignItems="center" mb={0.5} ml={3}>
                        <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                          Deal: {getDealName(task.lead_id)}
                        </Typography>
                      </Box>

                      {task.due_date && (
                        <Box display="flex" alignItems="center" mb={0.5} ml={3}>
                          <CalendarTodayIcon sx={{ fontSize: '0.75rem', color: '#94a3b8', mr: 0.5 }} />
                          <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </Typography>
                        </Box>
                      )}

                      <Box display="flex" justifyContent="flex-end" gap={0.5} mt={1}>
                        <IconButton 
                          size="small" 
                          sx={{ color: '#94a3b8', padding: '4px' }}
                          onClick={() => handleOpenModal(task)}
                        >
                          <EditIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          sx={{ color: '#ef4444', padding: '4px' }}
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <DeleteIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Add/Edit Task Modal */}
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
              {editingTask ? 'Edit Task' : 'Add New Task'}
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
                multiline
                rows={2}
                label="Task Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                label="Related Deal"
                value={formData.lead_id}
                onChange={(e) => setFormData({ ...formData, lead_id: e.target.value })}
                size="small"
                sx={{ 
                  '& .MuiOutlinedInput-root': { color: '#f1f5f9', fontSize: '0.85rem' },
                  '& .MuiInputLabel-root': { color: '#94a3b8', fontSize: '0.85rem' },
                }}
              >
                <MenuItem value="">None</MenuItem>
                {deals.map(deal => (
                  <MenuItem key={deal.id} value={deal.id}>{deal.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Due Date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                size="small"
                InputLabelProps={{ shrink: true }}
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
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                size="small"
                sx={{ 
                  '& .MuiOutlinedInput-root': { color: '#f1f5f9', fontSize: '0.85rem' },
                  '& .MuiInputLabel-root': { color: '#94a3b8', fontSize: '0.85rem' },
                }}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </TextField>
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
            onClick={handleSaveTask}
            variant="contained"
            disabled={!formData.description}
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': { backgroundColor: '#2563eb' },
              fontSize: '0.85rem',
              py: 0.5,
            }}
          >
            {editingTask ? 'Save Changes' : 'Add Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Tasks;
