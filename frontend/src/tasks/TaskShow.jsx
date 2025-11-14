import {
  Show,
  SimpleShowLayout,
  TextField,
  DateField,
  useRecordContext,
  EditButton,
  TopToolbar,
} from 'react-admin';
import { Card, CardContent, Typography, Box, Chip, Divider } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const TaskTitle = () => {
  const record = useRecordContext();
  return <span>Task: {record ? record.title : ''}</span>;
};

const ShowActions = () => (
  <TopToolbar>
    <EditButton />
  </TopToolbar>
);

const TaskShow = () => {
  const record = useRecordContext();
  
  return (
    <Show title={<TaskTitle />} actions={<ShowActions />}>
      <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            {record?.status === 'completed' ? (
              <CheckCircleIcon sx={{ color: '#22c55e', fontSize: 40 }} />
            ) : (
              <RadioButtonUncheckedIcon sx={{ color: '#64748b', fontSize: 40 }} />
            )}
            <Box flex={1}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  color: '#f1f5f9',
                  textDecoration: record?.status === 'completed' ? 'line-through' : 'none',
                }}
              >
                <TextField source="title" />
              </Typography>
            </Box>
            <Chip
              label={record?.status || 'pending'}
              color={record?.status === 'completed' ? 'success' : 'warning'}
              sx={{ textTransform: 'capitalize' }}
            />
          </Box>

          <Divider sx={{ mb: 3, borderColor: '#334155' }} />

          {record?.description && (
            <Box mb={3}>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                Description
              </Typography>
              <Typography variant="body1" sx={{ color: '#cbd5e1' }}>
                <TextField source="description" />
              </Typography>
            </Box>
          )}

          {record?.due_date && (
            <Box display="flex" alignItems="center" gap={1.5} mb={3}>
              <CalendarTodayIcon sx={{ color: '#94a3b8' }} />
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Due Date
                </Typography>
                <DateField source="due_date" sx={{ color: '#f1f5f9' }} />
              </Box>
            </Box>
          )}

          <Divider sx={{ my: 3, borderColor: '#334155' }} />

          <Box display="flex" gap={3}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Created
              </Typography>
              <DateField source="created_at" showTime sx={{ color: '#f1f5f9' }} />
            </Box>
            {record?.completed_at && (
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Completed
                </Typography>
                <DateField source="completed_at" showTime sx={{ color: '#f1f5f9' }} />
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Show>
  );
};

export default TaskShow;

