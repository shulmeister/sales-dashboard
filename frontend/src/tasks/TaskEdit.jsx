import {
  Edit,
  SimpleForm,
  TextInput,
  DateInput,
  SelectInput,
  ReferenceInput,
  required,
  useRecordContext,
} from 'react-admin';

const TaskTitle = () => {
  const record = useRecordContext();
  return <span>Edit Task: {record ? record.title : ''}</span>;
};

const TaskEdit = () => (
  <Edit title={<TaskTitle />} mutationMode="pessimistic">
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
        fullWidth
      />
    </SimpleForm>
  </Edit>
);

export default TaskEdit;

