import { Admin, Resource, CustomRoutes } from 'react-admin';
import { Route } from 'react-router-dom';
import { createTheme } from '@mui/material/styles';
import dataProvider from './dataProvider';
import authProvider from './authProvider';

// Resource components (we'll build these)
import { DealList, DealShow, DealCreate, DealEdit } from './deals';
import { ContactList, ContactShow, ContactCreate, ContactEdit } from './contacts';
import { CompanyList, CompanyShow, CompanyCreate, CompanyEdit } from './companies';
import { TaskList, TaskShow, TaskCreate, TaskEdit } from './tasks';

// Custom pages
import Dashboard from './dashboard/Dashboard';
import VisitsTracker from './visits/VisitsTracker';
import ActivityLogs from './activityLogs/ActivityLogs';

// Layout
import Layout from './layout/Layout';

// Icons (matching Atomic CRM)
import DealIcon from '@mui/icons-material/MonetizationOn';
import ContactIcon from '@mui/icons-material/People';
import CompanyIcon from '@mui/icons-material/Business';
import TaskIcon from '@mui/icons-material/Task';

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
      <Resource
        name="deals"
        list={DealList}
        show={DealShow}
        create={DealCreate}
        edit={DealEdit}
        icon={DealIcon}
        options={{ label: 'Deals' }}
      />
      <Resource
        name="contacts"
        list={ContactList}
        show={ContactShow}
        create={ContactCreate}
        edit={ContactEdit}
        icon={ContactIcon}
      />
      <Resource
        name="companies"
        list={CompanyList}
        show={CompanyShow}
        create={CompanyCreate}
        edit={CompanyEdit}
        icon={CompanyIcon}
      />
      <Resource
        name="tasks"
        list={TaskList}
        show={TaskShow}
        create={TaskCreate}
        edit={TaskEdit}
        icon={TaskIcon}
      />

      {/* Custom routes for your existing features */}
      <CustomRoutes>
        <Route path="/visits" element={<VisitsTracker />} />
        <Route path="/activity-logs" element={<ActivityLogs />} />
      </CustomRoutes>
    </Admin>
  );
}

export default App;
