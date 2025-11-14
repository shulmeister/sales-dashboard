import {
  Show,
  SimpleShowLayout,
  TextField,
  EmailField,
  DateField,
  NumberField,
  RichTextField,
  useRecordContext,
} from 'react-admin';
import { Box, Chip } from '@mui/material';

const DealTitle = () => {
  const record = useRecordContext();
  return <span>Deal: {record ? record.name : ''}</span>;
};

const PriorityField = () => {
  const record = useRecordContext();
  if (!record || !record.priority) return null;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <Chip
      label={record.priority.toUpperCase()}
      color={getPriorityColor(record.priority)}
      size="small"
    />
  );
};

const DealShow = () => (
  <Show title={<DealTitle />}>
    <SimpleShowLayout>
      <TextField source="name" label="Lead Name" />
      <TextField source="contact_name" label="Contact Person" />
      <EmailField source="email" />
      <TextField source="phone" />
      <TextField source="address" />
      <TextField source="city" />
      <TextField source="source" />
      <TextField source="payor_source" label="Payor Source" />
      <NumberField source="expected_revenue" label="Expected Monthly Revenue" options={{ style: 'currency', currency: 'USD' }} />
      <DateField source="expected_close_date" label="Expected Close Date" />
      <PriorityField source="priority" />
      <TextField source="stage_name" label="Pipeline Stage" />
      <RichTextField source="notes" />
      <DateField source="created_at" label="Created At" showTime />
    </SimpleShowLayout>
  </Show>
);

export default DealShow;

