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
import BusinessIcon from '@mui/icons-material/Business';

const Companies = () => {
  const [companies] = useState([
    {
      id: 1,
      name: 'Springfield Hospital',
      organization_type: 'Healthcare',
      contact_info: 'referrals@springfield.com',
      source: 'Direct',
      status: 'active',
      notes: 'Primary referral source',
    },
    {
      id: 2,
      name: 'Senior Living Center',
      organization_type: 'Senior Care',
      contact_info: '(555) 987-6543',
      source: 'Partnership',
      status: 'active',
      notes: 'Monthly meetings scheduled',
    },
    {
      id: 3,
      name: 'Community Health Network',
      organization_type: 'Healthcare',
      contact_info: 'info@commhealth.org',
      source: 'Conference',
      status: 'lead',
      notes: 'Met at industry conference',
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
          Companies / Referral Sources
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
          Add Company
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
                Company Name
              </TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 600, borderBottom: '1px solid #334155' }}>
                Type
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
            {companies.map((company) => (
              <TableRow
                key={company.id}
                sx={{
                  '&:hover': { backgroundColor: '#0f172a' },
                  borderBottom: '1px solid #334155',
                }}
              >
                <TableCell sx={{ borderBottom: '1px solid #334155' }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <BusinessIcon sx={{ color: '#3b82f6' }} />
                    <Typography sx={{ fontWeight: 600, color: '#f1f5f9' }}>
                      {company.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                  <Chip
                    label={company.organization_type}
                    size="small"
                    sx={{
                      backgroundColor: '#8b5cf620',
                      color: '#8b5cf6',
                      fontWeight: 600,
                    }}
                  />
                </TableCell>
                <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                  {company.contact_info}
                </TableCell>
                <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                  {company.source}
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid #334155' }}>
                  <Chip
                    label={company.status}
                    size="small"
                    sx={{
                      backgroundColor: `${getStatusColor(company.status)}20`,
                      color: getStatusColor(company.status),
                      textTransform: 'capitalize',
                      fontWeight: 600,
                    }}
                  />
                </TableCell>
                <TableCell sx={{ color: '#64748b', borderBottom: '1px solid #334155' }}>
                  <Typography variant="body2" sx={{ fontStyle: 'italic', maxWidth: '200px' }}>
                    {company.notes}
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

export default Companies;

