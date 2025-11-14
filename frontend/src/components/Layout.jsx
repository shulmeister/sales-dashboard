import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import TaskIcon from '@mui/icons-material/Task';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: <HomeIcon /> },
  { path: '/deals', label: 'Deals', icon: <MonetizationOnIcon /> },
  { path: '/contacts', label: 'Contacts', icon: <PeopleIcon /> },
  { path: '/companies', label: 'Companies', icon: <BusinessIcon /> },
  { path: '/tasks', label: 'Tasks', icon: <TaskIcon /> },
];

const Layout = ({ children }) => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Navigation Bar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: '#1e293b',
          borderBottom: '1px solid #334155',
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: '#f1f5f9',
              mr: 4,
            }}
          >
            Colorado CareAssist
          </Typography>

          {/* Horizontal Menu */}
          <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
            {menuItems.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                startIcon={item.icon}
                sx={{
                  color: isActive(item.path) ? '#3b82f6' : '#cbd5e1',
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  fontWeight: isActive(item.path) ? 600 : 400,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  backgroundColor: isActive(item.path) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  borderBottom: isActive(item.path) ? '2px solid #3b82f6' : '2px solid transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    color: '#3b82f6',
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Portal User
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          backgroundColor: '#0f172a',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;

