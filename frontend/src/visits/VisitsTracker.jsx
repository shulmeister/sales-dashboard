import { Card, CardContent, CardHeader, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const VisitsTracker = () => {
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
          title="Visits Tracker"
          sx={{
            color: '#f1f5f9',
            borderBottom: '1px solid #334155',
            '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.5rem' },
          }}
        />
        <CardContent>
          <Typography variant="body1" sx={{ color: '#f1f5f9', mb: 2 }}>
            Your existing Visits tracking functionality is available at:
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
              Access the full Visits tracker, Calls log, and file uploads
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
              💡 <strong>Coming Soon:</strong> We'll migrate Visits tracking directly into this modern interface 
              with enhanced features like calendar view, visit analytics, and mobile notifications.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default VisitsTracker;
