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
  FunctionField,
} from 'react-admin';
import { Box, Chip, Avatar } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';

const companyFilters = [
  <SearchInput source="q" alwaysOn placeholder="Search companies..." key="search" />,
];

const ListActions = () => (
  <TopToolbar>
    <CreateButton />
    <ExportButton />
  </TopToolbar>
);

const CompanyList = () => (
  <List
    filters={companyFilters}
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
        label="Company"
        render={(record) => (
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar sx={{ bgcolor: '#8b5cf6', width: 32, height: 32 }}>
              <BusinessIcon fontSize="small" />
            </Avatar>
            <Box>
              <Box sx={{ fontWeight: 600, color: '#f1f5f9' }}>{record.name}</Box>
              {record.organization && (
                <Box sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>{record.organization}</Box>
              )}
            </Box>
          </Box>
        )}
      />
      <EmailField source="email" />
      <TextField source="phone" />
      <FunctionField
        label="Type"
        render={(record) =>
          record.source_type ? (
            <Chip
              label={record.source_type}
              size="small"
              sx={{ backgroundColor: '#334155', color: '#cbd5e1' }}
            />
          ) : null
        }
      />
      <FunctionField
        label="Status"
        render={(record) => {
          const getStatusColor = (status) => {
            switch (status) {
              case 'active': return 'success';
              case 'incoming': return 'warning';
              case 'ongoing': return 'info';
              default: return 'default';
            }
          };
          return record.status ? (
            <Chip
              label={record.status}
              size="small"
              color={getStatusColor(record.status)}
            />
          ) : null;
        }}
      />
      <DateField source="created_at" label="Added" />
    </Datagrid>
  </List>
);

export default CompanyList;

