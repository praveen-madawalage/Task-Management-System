import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Box, Paper, Typography } from '@mui/material';
import type { Task, TaskStatus } from '../../types';
import { STATUSES, STATUS_LABELS } from '../../constants';
import TaskCard from './TaskCard';

interface TaskBoardProps {
  tasks: Task[];
  canChangeStatus: (task: Task) => boolean;
  canManageLabels: boolean;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onAddLabel: (taskId: string, name: string, color: string) => void;
  onRemoveLabel: (taskId: string, labelId: string) => void;
  onOpen: (task: Task) => void;
}

export default function TaskBoard({
  tasks,
  canChangeStatus,
  canManageLabels,
  onStatusChange,
  onAddLabel,
  onRemoveLabel,
  onOpen,
}: TaskBoardProps) {
  const byStatus = (s: TaskStatus) => tasks.filter((t) => t.status === s);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;
    onStatusChange(draggableId, destination.droppableId as TaskStatus);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
          alignItems: 'start',
        }}
      >
        {STATUSES.map((status) => (
          <Droppable droppableId={status} key={status}>
            {(provided) => (
              <Paper
                ref={provided.innerRef}
                {...provided.droppableProps}
                variant="outlined"
                sx={{
                  p: 1.5,
                  minHeight: 220,
                  // Faint lift above the canvas; cards (surface-2) sit above it.
                  bgcolor: 'rgba(255,255,255,0.02)',
                  backdropFilter: 'none',
                  WebkitBackdropFilter: 'none',
                }}
              >
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                  {STATUS_LABELS[status]} ({byStatus(status).length})
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {byStatus(status).map((task, index) => (
                    <Draggable
                      draggableId={task.id}
                      index={index}
                      key={task.id}
                      isDragDisabled={!canChangeStatus(task)}
                    >
                      {(prov) => (
                        <Box ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                          <TaskCard
                            task={task}
                            canManageLabels={canManageLabels}
                            onAddLabel={onAddLabel}
                            onRemoveLabel={onRemoveLabel}
                            onOpen={onOpen}
                          />
                        </Box>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              </Paper>
            )}
          </Droppable>
        ))}
      </Box>
    </DragDropContext>
  );
}
