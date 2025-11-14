import React from 'react';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Typography, Divider } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import TaskIcon from '@mui/icons-material/Task';
import LocalCarWashIcon from '@mui/icons-material/LocalCarWash';
import PhoneIcon from '@mui/icons-material/Phone';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ListAltIcon from '@mui/icons-material/ListAlt';

const DRAWER_WIDTH = 220;

const Layout = ({ children }) => {
  const location = useLocation();

  const crmMenuItems = [
    { path: '/', label: 'Dashboard', icon: <HomeIcon /> },
    { path: '/deals', label: 'Deals', icon: <MonetizationOnIcon /> },
    { path: '/contacts', label: 'Contacts', icon: <PeopleIcon /> },
    { path: '/companies', label: 'Companies', icon: <BusinessIcon /> },
    { path: '/tasks', label: 'Tasks', icon: <TaskIcon /> },
  ];

  const trackerMenuItems = [
    { path: '/visits', label: 'Visits', icon: <LocalCarWashIcon /> },
    { path: '/calls', label: 'Calls', icon: <PhoneIcon /> },
    { path: '/uploads', label: 'Uploads', icon: <UploadFileIcon /> },
    { path: '/activity-logs', label: 'Activity Logs', icon: <ListAltIcon /> },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f172a' }}>
      {/* Left Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            backgroundColor: '#1e293b',
            borderRight: '1px solid #334155',
            paddingTop: 2,
          },
        }}
      >
        {/* Logo */}
        <Box sx={{ px: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#f1f5f9' }}>
            Colorado CareAssist
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
            Sales Dashboard
          </Typography>
        </Box>

        <Divider sx={{ borderColor: '#334155', mb: 1 }} />

        {/* CRM Section */}
        <Box sx={{ px: 1.5, mb: 1 }}>
          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 600, px: 1 }}>
            CRM
          </Typography>
        </Box>
        <List sx={{ py: 0 }}>
          {crmMenuItems.map((item) => (
            <ListItem
              button
              key={item.path}
              component={Link}
              to={item.path}
              sx={{
                mb: 0.5,
                mx: 1,
                borderRadius: 1.5,
                backgroundColor: isActive(item.path) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                borderLeft: isActive(item.path) ? '3px solid #3b82f6' : '3px solid transparent',
                '&:hover': {
                  backgroundColor: 'rgba(59, 130, 246, 0.05)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: isActive(item.path) ? '#3b82f6' : '#94a3b8' }}>
                {React.cloneElement(item.icon, { sx: { fontSize: '1.1rem' } })}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.85rem',
                  fontWeight: isActive(item.path) ? 600 : 400,
                  color: isActive(item.path) ? '#3b82f6' : '#cbd5e1',
                }}
              />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ borderColor: '#334155', my: 1 }} />

        {/* Activity Tracker Section */}
        <Box sx={{ px: 1.5, mb: 1 }}>
          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 600, px: 1 }}>
            ACTIVITY TRACKER
          </Typography>
        </Box>
        <List sx={{ py: 0 }}>
          {trackerMenuItems.map((item) => (
            <ListItem
              button
              key={item.path}
              component={Link}
              to={item.path}
              sx={{
                mb: 0.5,
                mx: 1,
                borderRadius: 1.5,
                backgroundColor: isActive(item.path) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                borderLeft: isActive(item.path) ? '3px solid #3b82f6' : '3px solid transparent',
                '&:hover': {
                  backgroundColor: 'rgba(59, 130, 246, 0.05)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: isActive(item.path) ? '#3b82f6' : '#94a3b8' }}>
                {React.cloneElement(item.icon, { sx: { fontSize: '1.1rem' } })}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.85rem',
                  fontWeight: isActive(item.path) ? 600 : 400,
                  color: isActive(item.path) ? '#3b82f6' : '#cbd5e1',
                }}
              />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 2,
          backgroundColor: '#0f172a',
          color: '#f1f5f9',
          marginLeft: 0,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
