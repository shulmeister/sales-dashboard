import { Admin, Resource } from 'react-admin';
import { createTheme } from '@mui/material/styles';
import dataProvider from './dataProvider';
import authProvider from './authProvider';

// Custom pages
import Dashboard from './dashboard/Dashboard';

// Layout
import Layout from './layout/Layout';

// Super simple placeholder
const EmptyList = () => (
  <div style={{ padding: '20px', color: 'white', fontSize: '24px' }}>
    Coming soon... (placeholder page)
  </div>
);

// Dark theme matching your portal
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6',
    },
    secondary: {
      main: '#8b5cf6',
    },
    background: {
      default: '#0f172a',
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
});

function App() {
  console.log('🚀 App is rendering!');
  
  return (
    <Admin
      dataProvider={dataProvider}
      authProvider={authProvider}
      dashboard={Dashboard}
      layout={Layout}
      theme={darkTheme}
      disableTelemetry
      requireAuth={false}
    >
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
