import { Layout as RALayout, AppBar, UserMenu, useResourceDefinitions } from 'react-admin';
import { Box, Typography, Button } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import TaskIcon from '@mui/icons-material/Task';
import LocalCarWashIcon from '@mui/icons-material/LocalCarWash';
import ListAltIcon from '@mui/icons-material/ListAlt';

const CustomAppBar = () => {
  const location = useLocation();
  const resources = useResourceDefinitions();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <HomeIcon /> },
    { path: '/deals', label: 'Deals', icon: <MonetizationOnIcon /> },
    { path: '/contacts', label: 'Contacts', icon: <PeopleIcon /> },
    { path: '/companies', label: 'Companies', icon: <BusinessIcon /> },
    { path: '/tasks', label: 'Tasks', icon: <TaskIcon /> },
    { path: '/visits', label: 'Visits', icon: <LocalCarWashIcon /> },
    { path: '/activity-logs', label: 'Activity Logs', icon: <ListAltIcon /> },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <AppBar
      sx={{
        '& .RaAppBar-toolbar': {
          paddingLeft: 3,
          paddingRight: 3,
          minHeight: 64,
          backgroundColor: '#1e293b',
          borderBottom: '1px solid #334155',
        },
      }}
      userMenu={<UserMenu />}
    >
      <Box flex="1" display="flex" alignItems="center" gap={1}>
        <Typography
          variant="h6"
          color="inherit"
          sx={{
            fontWeight: 700,
            fontSize: '1.25rem',
            marginRight: 3,
            color: '#f1f5f9',
          }}
        >
          Colorado CareAssist
        </Typography>

        {/* Horizontal Menu Items */}
        <Box display="flex" gap={0.5} alignItems="center">
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
                padding: '8px 16px',
                borderRadius: 2,
                backgroundColor: isActive(item.path) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                borderBottom: isActive(item.path) ? '2px solid #3b82f6' : '2px solid transparent',
                '&:hover': {
                  backgroundColor: 'rgba(59, 130, 246, 0.05)',
                  color: '#3b82f6',
                },
                '& .MuiButton-startIcon': {
                  marginRight: '6px',
                },
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      </Box>
    </AppBar>
  );
};

const Layout = (props) => (
  <RALayout
    {...props}
    appBar={CustomAppBar}
    menu={() => null} // Remove sidebar completely
    sx={{
      '& .RaLayout-appFrame': {
        marginTop: '64px', // Account for AppBar height
      },
      '& .RaLayout-content': {
        backgroundColor: '#0f172a',
        minHeight: 'calc(100vh - 64px)',
        padding: 0,
      },
      '& .RaLayout-contentWithSidebar': {
        display: 'flex',
        flexDirection: 'column',
      },
    }}
  />
);

export default Layout;
