import {
  Show,
  SimpleShowLayout,
  TextField,
  EmailField,
  DateField,
  ReferenceField,
  useRecordContext,
  EditButton,
  TopToolbar,
} from 'react-admin';
import { Card, CardContent, Typography, Box, Avatar, Divider } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const ContactTitle = () => {
  const record = useRecordContext();
  return <span>Contact: {record ? record.name : ''}</span>;
};

const ShowActions = () => (
  <TopToolbar>
    <EditButton />
  </TopToolbar>
);

const ContactShow = () => (
  <Show title={<ContactTitle />} actions={<ShowActions />}>
    <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Avatar sx={{ bgcolor: '#3b82f6', width: 64, height: 64 }}>
            <PersonIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#f1f5f9', mb: 0.5 }}>
              <TextField source="name" />
            </Typography>
            {useRecordContext()?.title && (
              <Typography variant="body2" color="text.secondary">
                <TextField source="title" />
              </Typography>
            )}
          </Box>
        </Box>

        <Divider sx={{ mb: 3, borderColor: '#334155' }} />

        <Box display="flex" flexDirection="column" gap={2}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <EmailIcon sx={{ color: '#94a3b8' }} />
            <EmailField source="email" sx={{ color: '#f1f5f9' }} />
          </Box>

          {useRecordContext()?.phone && (
            <Box display="flex" alignItems="center" gap={1.5}>
              <PhoneIcon sx={{ color: '#94a3b8' }} />
              <TextField source="phone" sx={{ color: '#f1f5f9' }} />
            </Box>
          )}

          {useRecordContext()?.company && (
            <Box display="flex" alignItems="center" gap={1.5}>
              <BusinessIcon sx={{ color: '#94a3b8' }} />
              <TextField source="company" sx={{ color: '#f1f5f9' }} />
            </Box>
          )}

          {useRecordContext()?.city && (
            <Box display="flex" alignItems="center" gap={1.5}>
              <LocationOnIcon sx={{ color: '#94a3b8' }} />
              <TextField source="city" sx={{ color: '#f1f5f9' }} />
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 3, borderColor: '#334155' }} />

        <Box display="flex" gap={3}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Created
            </Typography>
            <DateField source="created_at" showTime sx={{ color: '#f1f5f9' }} />
          </Box>
          {useRecordContext()?.updated_at && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Last Updated
              </Typography>
              <DateField source="updated_at" showTime sx={{ color: '#f1f5f9' }} />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  </Show>
);

export default ContactShow;

