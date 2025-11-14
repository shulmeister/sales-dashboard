import { Admin, Resource } from 'react-admin';
import { createTheme } from '@mui/material/styles';
import dataProvider from './dataProvider';
import authProvider from './authProvider';

// Custom pages
import Dashboard from './dashboard/Dashboard';

// Layout
import Layout from './layout/Layout';

// Placeholder components for resources
const EmptyList = () => <div>Coming soon...</div>;

// Dark theme matching your portal
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6', // Blue matching your portal
    },
    secondary: {
      main: '#8b5cf6', // Purple accent
    },
    background: {
      default: '#0f172a', // Dark background like portal
      paper: '#1e293b',
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e293b',
          borderBottom: '1px solid #334155',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
        },
      },
    },
  },
});

function App() {
  return (
    <Admin
      dataProvider={dataProvider}
      authProvider={authProvider}
      dashboard={Dashboard}
      layout={Layout}
      theme={darkTheme}
      disableTelemetry
    >
      {/* Empty resources for now - just to make routes work */}
      <Resource name="deals" list={EmptyList} />
      <Resource name="contacts" list={EmptyList} />
      <Resource name="companies" list={EmptyList} />
      <Resource name="tasks" list={EmptyList} />
      <Resource name="visits" list={EmptyList} />
      <Resource name="activity-logs" list={EmptyList} />
    </Admin>
  );
}

export default App;
