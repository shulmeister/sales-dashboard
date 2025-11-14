import {
  List,
  Datagrid,
  TextField,
  EmailField,
  DateField,
  SearchInput,
  CreateButton,
  ExportButton,
  TopToolbar,
  useListContext,
  FunctionField,
} from 'react-admin';
import { Box, Chip, Avatar } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

const contactFilters = [
  <SearchInput source="q" alwaysOn placeholder="Search contacts..." key="search" />,
];

const ListActions = () => (
  <TopToolbar>
    <CreateButton />
    <ExportButton />
  </TopToolbar>
);

const ContactList = () => (
  <List
    filters={contactFilters}
    actions={<ListActions />}
    perPage={25}
    sort={{ field: 'name', order: 'ASC' }}
  >
    <Datagrid
      rowClick="show"
      sx={{
        '& .RaDatagrid-headerCell': {
          backgroundColor: '#1e293b',
          borderBottom: '2px solid #334155',
          color: '#cbd5e1',
          fontWeight: 600,
        },
        '& .RaDatagrid-row:hover': {
          backgroundColor: 'rgba(59, 130, 246, 0.05)',
        },
      }}
    >
      <FunctionField
        label="Contact"
        render={(record) => (
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar sx={{ bgcolor: '#3b82f6', width: 32, height: 32 }}>
              <PersonIcon fontSize="small" />
            </Avatar>
            <Box>
              <Box sx={{ fontWeight: 600, color: '#f1f5f9' }}>{record.name}</Box>
              {record.title && (
                <Box sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>{record.title}</Box>
              )}
            </Box>
          </Box>
        )}
      />
      <EmailField source="email" />
      <TextField source="phone" />
      <FunctionField
        label="Company"
        render={(record) =>
          record.company ? (
            <Chip
              label={record.company}
              size="small"
              sx={{ backgroundColor: '#334155', color: '#cbd5e1' }}
            />
          ) : null
        }
      />
      <TextField source="city" />
      <DateField source="created_at" label="Added" />
    </Datagrid>
  </List>
);

export default ContactList;

