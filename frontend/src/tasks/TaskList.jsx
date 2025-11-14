import {
  List,
  Datagrid,
  TextField,
  DateField,
  SearchInput,
  SelectInput,
  CreateButton,
  ExportButton,
  TopToolbar,
  FunctionField,
  BooleanField,
} from 'react-admin';
import { Box, Chip, Checkbox } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

const taskFilters = [
  <SearchInput source="q" alwaysOn placeholder="Search tasks..." key="search" />,
  <SelectInput
    source="status"
    choices={[
      { id: 'pending', name: 'Pending' },
      { id: 'completed', name: 'Completed' },
    ]}
    alwaysOn
    key="status"
  />,
];

const ListActions = () => (
  <TopToolbar>
    <CreateButton />
    <ExportButton />
  </TopToolbar>
);

const TaskList = () => (
  <List
    filters={taskFilters}
    actions={<ListActions />}
    perPage={25}
    sort={{ field: 'due_date', order: 'ASC' }}
  >
    <Datagrid
      rowClick="edit"
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
        label=" "
        render={(record) =>
          record.status === 'completed' ? (
            <CheckCircleIcon sx={{ color: '#22c55e' }} />
          ) : (
            <RadioButtonUncheckedIcon sx={{ color: '#64748b' }} />
          )
        }
        sortable={false}
      />
      <FunctionField
        label="Task"
        render={(record) => (
          <Box>
            <Box
              sx={{
                fontWeight: 500,
                color: record.status === 'completed' ? '#64748b' : '#f1f5f9',
                textDecoration: record.status === 'completed' ? 'line-through' : 'none',
              }}
            >
              {record.title}
            </Box>
            {record.description && (
              <Box sx={{ fontSize: '0.75rem', color: '#94a3b8', mt: 0.5 }}>
                {record.description.substring(0, 60)}
                {record.description.length > 60 ? '...' : ''}
              </Box>
            )}
          </Box>
        )}
      />
      <DateField source="due_date" label="Due Date" />
      <FunctionField
        label="Status"
        render={(record) => (
          <Chip
            label={record.status}
            size="small"
            color={record.status === 'completed' ? 'success' : 'warning'}
            sx={{ textTransform: 'capitalize' }}
          />
        )}
      />
      <DateField source="created_at" label="Created" />
    </Datagrid>
  </List>
);

export default TaskList;

