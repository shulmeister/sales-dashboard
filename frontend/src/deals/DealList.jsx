import React, { useState } from 'react';
import {
  useListContext,
  useGetList,
  useUpdate,
  CreateButton,
  ExportButton,
  TopToolbar,
  Title,
} from 'react-admin';
import { Box, Card, CardContent, Typography, Chip, IconButton } from '@mui/material';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';

const ITEM_TYPE = 'deal';

// Deal Card Component
const DealCard = ({ deal, onEdit }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { id: deal.id, stage_id: deal.stage_id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <Card
      ref={drag}
      sx={{
        mb: 2,
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: '#0f172a',
        border: '1px solid #334155',
        '&:hover': {
          borderColor: '#3b82f6',
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)',
        },
        transition: 'all 0.2s',
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, color: '#f1f5f9' }}>
            {deal.name}
          </Typography>
          {deal.priority && (
            <Chip
              label={deal.priority.toUpperCase()}
              size="small"
              color={getPriorityColor(deal.priority)}
              sx={{ height: 20, fontSize: '0.65rem' }}
            />
          )}
        </Box>

        {deal.email && (
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
            ✉️ {deal.email}
          </Typography>
        )}
        {deal.phone && (
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
            📞 {deal.phone}
          </Typography>
        )}
        {deal.city && (
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 1 }}>
            📍 {deal.city}
          </Typography>
        )}

        <Box display="flex" gap={0.5} flexWrap="wrap" mb={1}>
          {deal.source && (
            <Chip label={deal.source} size="small" sx={{ height: 22, fontSize: '0.7rem' }} />
          )}
          {deal.payor_source && (
            <Chip label={deal.payor_source} size="small" sx={{ height: 22, fontSize: '0.7rem' }} />
          )}
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" pt={1} borderTop="1px solid #334155">
          {deal.expected_revenue && (
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#22c55e' }}>
              ${parseFloat(deal.expected_revenue).toLocaleString()}/mo
            </Typography>
          )}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(deal.id);
            }}
            sx={{ color: '#cbd5e1' }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

// Kanban Column Component
const KanbanColumn = ({ stage, deals, onDrop }) => {
  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE,
    drop: (item) => onDrop(item.id, stage.id),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const navigate = useNavigate();

  return (
    <Box
      ref={drop}
      sx={{
        borderRadius: 2,
        p: 2,
        minHeight: 600,
        flex: 1,
        backgroundColor: isOver ? 'rgba(59, 130, 246, 0.05)' : '#1e293b',
        border: isOver ? '2px dashed #3b82f6' : '1px solid #334155',
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} pb={1.5} borderBottom="2px solid #334155">
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1.1rem' }}>
          {stage.name}
        </Typography>
        <Chip
          label={deals.length}
          size="small"
          sx={{
            backgroundColor: '#334155',
            color: '#cbd5e1',
            fontWeight: 600,
          }}
        />
      </Box>

      {deals.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" py={3} fontSize="0.875rem">
          No deals yet
        </Typography>
      ) : (
        deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            onEdit={(id) => navigate(`/deals/${id}`)}
          />
        ))
      )}
    </Box>
  );
};

// List Actions
const ListActions = () => (
  <TopToolbar>
    <CreateButton />
    <ExportButton />
  </TopToolbar>
);

// Main Deals List Component
const DealList = () => {
  const { data: stages } = useGetList('pipeline/stages', {
    pagination: { page: 1, perPage: 100 },
    sort: { field: 'order_index', order: 'ASC' },
  });

  const { data: deals, isLoading, refetch } = useListContext();
  const [update] = useUpdate();

  const handleDrop = async (dealId, newStageId) => {
    const deal = deals?.find((d) => d.id === dealId);
    if (deal && deal.stage_id !== newStageId) {
      await update(
        'deals',
        {
          id: dealId,
          data: { ...deal, stage_id: newStageId },
          previousData: deal,
        },
        {
          onSuccess: () => {
            refetch();
          },
        }
      );
    }
  };

  if (isLoading || !stages) {
    return <Box p={3}><Typography>Loading pipeline...</Typography></Box>;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <Box>
        <Title title="Deals Pipeline" />
        <ListActions />
        
        <Box display="flex" gap={2} p={2}>
          {stages?.map((stage) => {
            const stageDeals = deals?.filter((deal) => deal.stage_id === stage.id) || [];
            return (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                deals={stageDeals}
                onDrop={handleDrop}
              />
            );
          })}
        </Box>
      </Box>
    </DndProvider>
  );
};

export default DealList;

