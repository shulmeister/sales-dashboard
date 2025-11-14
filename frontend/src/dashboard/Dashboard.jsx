import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

const Dashboard = () => {
  return (
    <Box p={3} sx={{ backgroundColor: '#0f172a', minHeight: '100vh' }}>
      <Typography variant="h3" sx={{ color: '#f1f5f9', mb: 3 }}>
        🎉 DASHBOARD IS WORKING!
      </Typography>
      
      <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155', mb: 3 }}>
        <CardContent>
          <Typography variant="h5" sx={{ color: '#3b82f6', mb: 2 }}>
            Test Card 1
          </Typography>
          <Typography sx={{ color: '#94a3b8' }}>
            If you can see this, React is working!
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <CardContent>
          <Typography variant="h5" sx={{ color: '#22c55e', mb: 2 }}>
            Test Card 2
          </Typography>
          <Typography sx={{ color: '#94a3b8' }}>
            This is a simple test to verify rendering works.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
