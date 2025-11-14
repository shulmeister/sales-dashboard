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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';

const Contacts = () => {
  const [contacts] = useState([
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#22c55e';
      case 'lead': return '#3b82f6';
      case 'inactive': return '#94a3b8';
      default: return '#94a3b8';
    }
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
                    <IconButton size="small" sx={{ color: '#ef4444' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default Contacts;

