import { Layout as RALayout, AppBar, Menu, UserMenu } from 'react-admin';
import { Box, Typography } from '@mui/material';

const CustomAppBar = () => (
  <AppBar
    sx={{
      '& .RaAppBar-toolbar': {
        paddingLeft: 3,
        paddingRight: 3,
      },
    }}
    userMenu={<UserMenu />}
  >
    <Box flex="1" display="flex" alignItems="center" gap={2}>
      <Typography
        variant="h6"
        color="inherit"
        sx={{
          fontWeight: 700,
          fontSize: '1.2rem',
        }}
      >
        Colorado CareAssist CRM
      </Typography>
    </Box>
  </AppBar>
);

const CustomMenu = () => (
  <Menu
    sx={{
      marginTop: 0,
      '& .RaMenuItemLink-active': {
        borderLeft: '4px solid',
        borderLeftColor: 'primary.main',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
      },
    }}
  />
);

const Layout = (props) => (
  <RALayout
    {...props}
    appBar={CustomAppBar}
    menu={CustomMenu}
    sx={{
      '& .RaLayout-content': {
        backgroundColor: '#0f172a',
        minHeight: 'calc(100vh - 48px)',
      },
    }}
  />
);

export default Layout;

