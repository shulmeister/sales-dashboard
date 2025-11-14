import { Card, CardContent, CardHeader, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ActivityLogs = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/')}
        sx={{ mb: 2, color: '#94a3b8' }}
      >
        Back to Dashboard
      </Button>

      <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <CardHeader
          title="Activity Logs"
          sx={{
            color: '#f1f5f9',
            borderBottom: '1px solid #334155',
            '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.5rem' },
          }}
        />
        <CardContent>
          <Typography variant="body1" sx={{ color: '#f1f5f9', mb: 2 }}>
            Your existing Activity Logs are available at:
          </Typography>

          <Box sx={{ 
            backgroundColor: '#0f172a', 
            border: '2px solid #3b82f6',
            borderRadius: 2,
            p: 3,
            textAlign: 'center'
          }}>
            <Typography variant="h6" sx={{ color: '#3b82f6', mb: 2, fontWeight: 600 }}>
              Legacy Dashboard
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
              View all activity logs, sync history, and system events
            </Typography>
            <Button
              variant="contained"
              href="/legacy"
              target="_blank"
              sx={{
                backgroundColor: '#3b82f6',
                '&:hover': { backgroundColor: '#2563eb' },
                px: 4,
                py: 1.5,
                fontWeight: 600,
              }}
            >
              Open Legacy Dashboard
            </Button>
          </Box>

          <Box sx={{ mt: 4, p: 2, backgroundColor: '#0f172a', borderRadius: 2, border: '1px solid #334155' }}>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              💡 <strong>Coming Soon:</strong> We'll add a modern activity timeline directly in this interface 
              with filtering, search, and real-time updates for all CRM activities.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ActivityLogs;
