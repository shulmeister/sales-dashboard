import {
  Create,
  SimpleForm,
  TextInput,
  required,
  email,
} from 'react-admin';

const ContactCreate = () => (
  <Create redirect="show">
    <SimpleForm>
      <TextInput
        source="name"
        label="Full Name"
        validate={[required()]}
        fullWidth
      />
      <TextInput
        source="title"
        label="Job Title"
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
        source="company"
        label="Company"
        fullWidth
      />
      <TextInput
        source="address"
        label="Street Address"
        fullWidth
      />
      <TextInput
        source="city"
        label="City"
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

export default ContactCreate;

