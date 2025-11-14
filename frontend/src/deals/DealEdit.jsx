import {
  Edit,
  SimpleForm,
  TextInput,
  SelectInput,
  NumberInput,
  DateInput,
  required,
  useRecordContext,
} from 'react-admin';

const DealTitle = () => {
  const record = useRecordContext();
  return <span>Edit Deal: {record ? record.name : ''}</span>;
};

const DealEdit = () => (
  <Edit title={<DealTitle />} mutationMode="pessimistic">
    <SimpleForm>
      <TextInput source="name" label="Lead Name" validate={[required()]} fullWidth />
      <TextInput source="contact_name" label="Contact Person" fullWidth />
      <TextInput source="email" type="email" fullWidth />
      <TextInput source="phone" fullWidth />
      <TextInput source="address" fullWidth />
      <TextInput source="city" fullWidth />
      
      <SelectInput
        source="source"
        choices={[
          { id: 'Referral', name: 'Referral' },
          { id: 'Direct', name: 'Direct' },
          { id: 'Website', name: 'Website' },
          { id: 'Cold Call', name: 'Cold Call' },
          { id: 'Event', name: 'Event' },
          { id: 'Other', name: 'Other' },
        ]}
        fullWidth
      />
      
      <SelectInput
        source="payor_source"
        label="Payor Source"
        choices={[
          { id: 'Medicaid', name: 'Medicaid' },
          { id: 'Medicare', name: 'Medicare' },
          { id: 'Private Pay', name: 'Private Pay' },
          { id: 'Insurance', name: 'Insurance' },
          { id: 'VA', name: 'VA' },
          { id: 'Other', name: 'Other' },
        ]}
        fullWidth
      />
      
      <NumberInput source="expected_revenue" label="Expected Monthly Revenue" fullWidth />
      <DateInput source="expected_close_date" label="Expected Close Date" fullWidth />
      
      <SelectInput
        source="priority"
        choices={[
          { id: 'high', name: 'High' },
          { id: 'medium', name: 'Medium' },
          { id: 'low', name: 'Low' },
        ]}
        fullWidth
      />
      
      <TextInput source="notes" multiline rows={4} fullWidth />
    </SimpleForm>
  </Edit>
);

export default DealEdit;

