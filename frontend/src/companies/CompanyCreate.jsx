import {
  Create,
  SimpleForm,
  TextInput,
  SelectInput,
  required,
  email,
} from 'react-admin';

const CompanyCreate = () => (
  <Create redirect="show">
    <SimpleForm>
      <TextInput
        source="name"
        label="Company Name"
        validate={[required()]}
        fullWidth
      />
      <TextInput
        source="organization"
        label="Organization/Division"
        fullWidth
      />
      <TextInput
        source="contact_name"
        label="Primary Contact"
        fullWidth
      />
      <TextInput
        source="email"
        type="email"
        validate={[email()]}
        fullWidth
      />
      <TextInput
        source="phone"
        label="Phone Number"
        fullWidth
      />
      <TextInput
        source="address"
        label="Street Address"
        fullWidth
      />
      <SelectInput
        source="source_type"
        label="Company Type"
        choices={[
          { id: 'Healthcare Facility', name: 'Healthcare Facility' },
          { id: 'Insurance Provider', name: 'Insurance Provider' },
          { id: 'Agency', name: 'Agency' },
          { id: 'Individual', name: 'Individual' },
          { id: 'Government', name: 'Government' },
          { id: 'Other', name: 'Other' },
        ]}
        fullWidth
      />
      <SelectInput
        source="status"
        label="Status"
        choices={[
          { id: 'active', name: 'Active' },
          { id: 'incoming', name: 'Incoming' },
          { id: 'ongoing', name: 'Ongoing' },
          { id: 'inactive', name: 'Inactive' },
        ]}
        defaultValue="active"
        fullWidth
      />
      <TextInput
        source="notes"
        label="Notes"
        multiline
        rows={4}
        fullWidth
      />
    </SimpleForm>
  </Create>
);

export default CompanyCreate;

