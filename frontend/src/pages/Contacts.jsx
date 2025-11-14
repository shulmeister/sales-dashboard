import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import CloseIcon from '@mui/icons-material/Close';

const Contacts = () => {
  const [contacts, setContacts] = useState([
    {
      id: 1,
      name: 'John Smith',
      email: 'john@example.com',
      phone: '(555) 123-4567',
      source: 'Website',
      status: 'active',
      notes: 'Primary contact for home care',
    },
    {
      id: 2,
      name: 'Mary Johnson',
      email: 'mary.j@email.com',
      phone: '(555) 234-5678',
      source: 'Referral',
      status: 'active',
      notes: 'Referred by Dr. Williams',
    },
    {
      id: 3,
      name: 'Robert Davis',
      email: 'robert.d@email.com',
      phone: '(555) 345-6789',
      source: 'Social Media',
      status: 'lead',
      notes: 'Interested in evening care',
    },
    {
      id: 4,
      name: 'Sarah Wilson',
      email: 'sarah.w@email.com',
      phone: '(555) 456-7890',
      source: 'Direct',
      status: 'active',
      notes: 'Family caregiver support',
    },
  ]);

  const [openModal, setOpenModal] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    source: '',
    status: 'lead',
    notes: '',
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#22c55e';
      case 'lead': return '#3b82f6';
      case 'inactive': return '#94a3b8';
      default: return '#94a3b8';
    }
  };

  const handleAddContact = () => {
    const contactToAdd = {
      ...newContact,
      id: Math.max(...contacts.map(c => c.id), 0) + 1,
    };
    
    setContacts([...contacts, contactToAdd]);
    setOpenModal(false);
    setNewContact({
      name: '',
      email: '',
      phone: '',
      source: '',
      status: 'lead',
      notes: '',
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#f1f5f9' }}>
          Contacts
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenModal(true)}
          sx={{
            backgroundColor: '#3b82f6',
            '&:hover': { backgroundColor: '#2563eb' },
            textTransform: 'none',
          }}
        >
          Add Contact
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#0f172a' }}>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 600, borderBottom: '1px solid #334155' }}>
                Name
              </TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 600, borderBottom: '1px solid #334155' }}>
                Contact Info
              </TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 600, borderBottom: '1px solid #334155' }}>
                Source
              </TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 600, borderBottom: '1px solid #334155' }}>
                Status
              </TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 600, borderBottom: '1px solid #334155' }}>
                Notes
              </TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 600, borderBottom: '1px solid #334155' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow
                key={contact.id}
                sx={{
                  '&:hover': { backgroundColor: '#0f172a' },
                  borderBottom: '1px solid #334155',
                }}
              >
                <TableCell sx={{ color: '#f1f5f9', borderBottom: '1px solid #334155' }}>
                  <Typography sx={{ fontWeight: 600 }}>{contact.name}</Typography>
                </TableCell>
                <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <EmailIcon fontSize="small" />
                      {contact.email}
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PhoneIcon fontSize="small" />
                      {contact.phone}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                  {contact.source}
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid #334155' }}>
                  <Chip
                    label={contact.status}
                    size="small"
                    sx={{
                      backgroundColor: `${getStatusColor(contact.status)}20`,
                      color: getStatusColor(contact.status),
                      textTransform: 'capitalize',
                      fontWeight: 600,
                    }}
                  />
                </TableCell>
                <TableCell sx={{ color: '#64748b', borderBottom: '1px solid #334155' }}>
                  <Typography variant="body2" sx={{ fontStyle: 'italic', maxWidth: '200px' }}>
                    {contact.notes}
                  </Typography>
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid #334155' }}>
                  <Box display="flex" gap={0.5}>
                    <IconButton size="small" sx={{ color: '#94a3b8' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      sx={{ color: '#ef4444' }}
                      onClick={() => setContacts(contacts.filter(c => c.id !== contact.id))}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Contact Modal */}
      <Dialog 
        open={openModal} 
        onClose={() => setOpenModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
          }
        }}
      >
        <DialogTitle sx={{ color: '#f1f5f9', borderBottom: '1px solid #334155' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Add New Contact
            <IconButton onClick={() => setOpenModal(false)} sx={{ color: '#94a3b8' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                sx={{ 
                  '& .MuiOutlinedInput-root': { color: '#f1f5f9' },
                  '& .MuiInputLabel-root': { color: '#94a3b8' },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                sx={{ 
                  '& .MuiOutlinedInput-root': { color: '#f1f5f9' },
                  '& .MuiInputLabel-root': { color: '#94a3b8' },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                sx={{ 
                  '& .MuiOutlinedInput-root': { color: '#f1f5f9' },
                  '& .MuiInputLabel-root': { color: '#94a3b8' },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Source"
                value={newContact.source}
                onChange={(e) => setNewContact({ ...newContact, source: e.target.value })}
                sx={{ 
                  '& .MuiOutlinedInput-root': { color: '#f1f5f9' },
                  '& .MuiInputLabel-root': { color: '#94a3b8' },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Status"
                value={newContact.status}
                onChange={(e) => setNewContact({ ...newContact, status: e.target.value })}
                sx={{ 
                  '& .MuiOutlinedInput-root': { color: '#f1f5f9' },
                  '& .MuiInputLabel-root': { color: '#94a3b8' },
                }}
              >
                <MenuItem value="lead">Lead</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={newContact.notes}
                onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                sx={{ 
                  '& .MuiOutlinedInput-root': { color: '#f1f5f9' },
                  '& .MuiInputLabel-root': { color: '#94a3b8' },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #334155', p: 2 }}>
          <Button onClick={() => setOpenModal(false)} sx={{ color: '#94a3b8' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddContact}
            variant="contained"
            disabled={!newContact.name || !newContact.email}
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': { backgroundColor: '#2563eb' },
            }}
          >
            Add Contact
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Contacts;
