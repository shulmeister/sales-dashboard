import {
  Show,
  SimpleShowLayout,
  TextField,
  EmailField,
  DateField,
  useRecordContext,
  EditButton,
  TopToolbar,
} from 'react-admin';
import { Card, CardContent, Typography, Box, Avatar, Divider, Chip } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CategoryIcon from '@mui/icons-material/Category';

const CompanyTitle = () => {
  const record = useRecordContext();
  return <span>Company: {record ? record.name : ''}</span>;
};

const ShowActions = () => (
  <TopToolbar>
    <EditButton />
  </TopToolbar>
);

const CompanyShow = () => (
  <Show title={<CompanyTitle />} actions={<ShowActions />}>
    <Card sx={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Avatar sx={{ bgcolor: '#8b5cf6', width: 64, height: 64 }}>
            <BusinessIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#f1f5f9', mb: 0.5 }}>
              <TextField source="name" />
            </Typography>
            {useRecordContext()?.organization && (
              <Typography variant="body2" color="text.secondary">
                <TextField source="organization" />
              </Typography>
            )}
          </Box>
          <Box ml="auto">
            {useRecordContext()?.status && (
              <Chip
                label={useRecordContext().status}
                color={
                  useRecordContext().status === 'active' ? 'success' :
                  useRecordContext().status === 'incoming' ? 'warning' : 'info'
                }
              />
            )}
          </Box>
        </Box>

        <Divider sx={{ mb: 3, borderColor: '#334155' }} />

        <Box display="flex" flexDirection="column" gap={2}>
          {useRecordContext()?.contact_name && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                Contact Person
              </Typography>
              <Typography variant="body1" sx={{ color: '#f1f5f9' }}>
                <TextField source="contact_name" />
              </Typography>
            </Box>
          )}

          {useRecordContext()?.email && (
            <Box display="flex" alignItems="center" gap={1.5}>
              <EmailIcon sx={{ color: '#94a3b8' }} />
              <EmailField source="email" sx={{ color: '#f1f5f9' }} />
            </Box>
          )}

          {useRecordContext()?.phone && (
            <Box display="flex" alignItems="center" gap={1.5}>
              <PhoneIcon sx={{ color: '#94a3b8' }} />
              <TextField source="phone" sx={{ color: '#f1f5f9' }} />
            </Box>
          )}

          {useRecordContext()?.address && (
            <Box display="flex" alignItems="center" gap={1.5}>
              <LocationOnIcon sx={{ color: '#94a3b8' }} />
              <TextField source="address" sx={{ color: '#f1f5f9' }} />
            </Box>
          )}

          {useRecordContext()?.source_type && (
            <Box display="flex" alignItems="center" gap={1.5}>
              <CategoryIcon sx={{ color: '#94a3b8' }} />
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Type
                </Typography>
                <TextField source="source_type" sx={{ color: '#f1f5f9' }} />
              </Box>
            </Box>
          )}
        </Box>

        {useRecordContext()?.notes && (
          <>
            <Divider sx={{ my: 3, borderColor: '#334155' }} />
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                Notes
              </Typography>
              <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                <TextField source="notes" />
              </Typography>
            </Box>
          </>
        )}

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

export default CompanyShow;

