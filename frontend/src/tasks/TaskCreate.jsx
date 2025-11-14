import {
  Create,
  SimpleForm,
  TextInput,
  DateInput,
  SelectInput,
  ReferenceInput,
  required,
} from 'react-admin';

const TaskCreate = () => (
  <Create redirect="list">
    <SimpleForm>
      <TextInput
        source="title"
        label="Task Title"
        validate={[required()]}
        fullWidth
      />
      <TextInput
        source="description"
        label="Description"
        multiline
        rows={3}
        fullWidth
      />
      <DateInput
        source="due_date"
        label="Due Date"
        fullWidth
      />
      <SelectInput
        source="status"
        label="Status"
        choices={[
          { id: 'pending', name: 'Pending' },
          { id: 'completed', name: 'Completed' },
        ]}
        defaultValue="pending"
        fullWidth
      />
    </SimpleForm>
  </Create>
);

export default TaskCreate;

