import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Card, CardContent, List, ListItem, ListItemText, Chip } from '@mui/material';
import ListAltIcon from '@mui/icons-material/ListAlt';

const ActivityLogs = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  const fetchActivityLogs = async () => {
    try {
      const response = await fetch('/api/activity-logs', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Typography sx={{ color: '#f1f5f9', fontSize: '0.8rem' }}>Loading activity logs...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <ListAltIcon sx={{ color: '#3b82f6', fontSize: '1.5rem' }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1.1rem' }}>
          Activity Logs
        </Typography>
      </Box>

      <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <CardContent sx={{ p: 2 }}>
          {activities.length > 0 ? (
            <List>
              {activities.map((activity) => (
                <ListItem key={activity.id} sx={{ borderBottom: '1px solid #334155', py: 2 }}>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography sx={{ color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 600 }}>
                          {activity.name || 'Activity Log'}
                        </Typography>
                        <Chip
                          label={activity.manually_added ? 'Manual' : 'Auto'}
                          size="small"
                          sx={{
                            backgroundColor: activity.manually_added ? '#f59e0b' : '#3b82f6',
                            color: '#fff',
                            height: '18px',
                            fontSize: '0.65rem',
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box mt={0.5}>
                        <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                          Modified: {activity.modified_time ? new Date(activity.modified_time).toLocaleDateString() : '-'}
                        </Typography>
                        {activity.owner && (
                          <Typography sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                            Owner: {activity.owner}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ListAltIcon sx={{ fontSize: '4rem', color: '#64748b', mb: 2 }} />
              <Typography sx={{ color: '#f1f5f9', fontSize: '1rem', mb: 1 }}>
                No Activity Logs
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                Activity logs will appear here when you start tracking.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default ActivityLogs;

