// src/views/KanbanView.tsx - Fixed Container and Scrolling
import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import { openTaskModal, openTaskDetail, openDeleteConfirm, selectKanbanGroupBy } from '../../ui/store/uiSlice';
import { selectTasksByPriority, selectTasksByStatus } from '../../tasks/store/tasksSlice';
import { selectCurrentProject } from '../../projects/store/projectsSlice';
import { TaskPriority, TaskStatus, Task } from '../../../types';
import { executeCommand } from '../../commands/store/commandSlice';
import { createTaskCommand, updateTaskPriorityCommand, updateTaskStatusCommand, reorderTasksCommand, reorderTasksByStatusCommand } from '../../commands/commands/taskCommands';
import { WriteGuard } from '../../../shared/components/PermissionGuard';
import { getProjectPermissions } from '../../../shared/lib/permissions';

const KanbanView: React.FC = () => {
  const dispatch = useAppDispatch();

  const kanbanGroupBy = useAppSelector(selectKanbanGroupBy);
  const tasksByPriority = useAppSelector(selectTasksByPriority);
  const tasksByStatus = useAppSelector(selectTasksByStatus);
  const currentProject = useAppSelector(selectCurrentProject);

  // Determine which grouping to use
  const taskGroups = kanbanGroupBy === 'priority' ? tasksByPriority : tasksByStatus;
  const columnIds = kanbanGroupBy === 'priority'
    ? (['low', 'medium', 'high', 'urgent'] as const)
    : (['not started', 'in progress', 'completed'] as const);

  // State for quick add task inputs in each column
  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, string>>({
    low: '',
    medium: '',
    high: '',
    urgent: '',
    'not started': '',
    'in progress': '',
    'completed': ''
  });

  // State to track which column has an active input
  const [activeInputColumn, setActiveInputColumn] = useState<string | null>(null);

  // Ref for click outside detection
  const createTaskRefs = useRef<Record<string, HTMLDivElement | null>>({
    low: null,
    medium: null,
    high: null,
    urgent: null,
    'not started': null,
    'in progress': null,
    'completed': null
  });

  // Handle click outside to close create task forms
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeInputColumn) {
        const activeRef = createTaskRefs.current[activeInputColumn];
        if (activeRef && !activeRef.contains(event.target as Node)) {
          setActiveInputColumn(null);
          // Reset the input when closing
          setNewTaskInputs(prev => ({
            ...prev,
            [activeInputColumn]: ''
          }));
        }
      }
    };

    if (activeInputColumn) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeInputColumn]);

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination } = result;

    // Dropped outside a droppable area
    if (!destination) return;

    // Dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    if (!currentProject) return;

    // Get the task ID from the draggable ID
    const taskId = result.draggableId;

    console.log('🎯 DRAG END:', {
      groupBy: kanbanGroupBy,
      source: source.droppableId,
      destination: destination.droppableId,
      taskId,
      sourceIndex: source.index,
      destinationIndex: destination.index
    });

    try {
      if (kanbanGroupBy === 'priority') {
        // Priority-based grouping
        const sourcePriority = source.droppableId as TaskPriority;
        const destinationPriority = destination.droppableId as TaskPriority;

        if (sourcePriority !== destinationPriority) {
          // Moving between columns - use updateTaskPriorityCommand
          console.log('🔄 Moving between priority columns');

          const command = updateTaskPriorityCommand({
            projectId: currentProject.id,
            taskId: taskId,
            priority: destinationPriority,
            destinationIndex: destination.index
          });

          await dispatch(executeCommand(command)).unwrap();
          console.log('✅ Priority update command executed successfully');

        } else {
          // Reordering within the same priority column
          console.log('🔄 Reordering within priority column');

          const columnTasks = tasksByPriority[sourcePriority];
          const reorderedTasks = Array.from(columnTasks);
          const [movedTask] = reorderedTasks.splice(source.index, 1);
          reorderedTasks.splice(destination.index, 0, movedTask);
          const newOrder = reorderedTasks.map(task => task.id);

          const command = reorderTasksCommand({
            projectId: currentProject.id,
            priority: sourcePriority,
            taskIds: newOrder
          });

          await dispatch(executeCommand(command)).unwrap();
          console.log('✅ Reorder command executed successfully');
        }
      } else {
        // Status-based grouping
        const sourceStatus = source.droppableId as TaskStatus;
        const destinationStatus = destination.droppableId as TaskStatus;

        if (sourceStatus !== destinationStatus) {
          // Moving between columns - use updateTaskStatusCommand
          console.log('🔄 Moving between status columns');

          const command = updateTaskStatusCommand({
            projectId: currentProject.id,
            taskId: taskId,
            status: destinationStatus,
            destinationIndex: destination.index
          });

          await dispatch(executeCommand(command)).unwrap();
          console.log('✅ Status update command executed successfully');

        } else {
          // Reordering within the same status column
          console.log('🔄 Reordering within status column');

          const columnTasks = tasksByStatus[sourceStatus];
          const reorderedTasks = Array.from(columnTasks);
          const [movedTask] = reorderedTasks.splice(source.index, 1);
          reorderedTasks.splice(destination.index, 0, movedTask);
          const newOrder = reorderedTasks.map(task => task.id);

          const command = reorderTasksByStatusCommand({
            projectId: currentProject.id,
            status: sourceStatus,
            taskIds: newOrder
          });

          await dispatch(executeCommand(command)).unwrap();
          console.log('✅ Reorder command executed successfully');
        }
      }

    } catch (error) {
      console.error('❌ Drag & drop command failed:', error);
    }
  };

  // Handle showing the task input for a specific column
  const handleShowInput = (columnId: string) => {
    setActiveInputColumn(columnId);
  };

  // Handle input change
  const handleInputChange = (columnId: string, value: string) => {
    setNewTaskInputs(prev => ({
      ...prev,
      [columnId]: value
    }));
  };

  // Handle creating a new task
  const handleCreateTask = async (columnId: string) => {
    const title = newTaskInputs[columnId].trim();
    if (!title) return;

    if (!currentProject) {
      console.error('No project selected');
      return;
    }

    try {
      console.log('🎯 Creating CREATE command for Kanban quick-add:', title);

      // Determine priority and status based on grouping mode
      let priority: TaskPriority = 'low';
      let status: TaskStatus = 'not started';

      if (kanbanGroupBy === 'priority') {
        priority = columnId as TaskPriority;
      } else {
        status = columnId as TaskStatus;
      }

      const command = createTaskCommand({
        projectId: currentProject.id,
        title,
        description: '',
        status,
        priority,
        customFields: {}
      });

      await dispatch(executeCommand(command)).unwrap();
      console.log('✅ Kanban quick-add command executed successfully');

      // Reset the input on success
      setNewTaskInputs(prev => ({
        ...prev,
        [columnId]: ''
      }));
      setActiveInputColumn(null);
    } catch (error) {
      console.error('❌ Kanban quick-add command failed:', error);
    }
  };

  // Handle canceling task creation
  const handleCancelTask = () => {
    setActiveInputColumn(null);
  };

  // Handle key press events (Enter to submit, Escape to cancel)
  const handleKeyDown = (e: React.KeyboardEvent, columnId: string) => {
    if (e.key === 'Enter') {
      handleCreateTask(columnId);
    } else if (e.key === 'Escape') {
      handleCancelTask();
    }
  };

  // Get column color class
  const getColumnColorClass = (columnId: string): string => {
    if (kanbanGroupBy === 'priority') {
      const priority = columnId as TaskPriority;
      switch (priority) {
        case 'urgent': return 'border-red-400';
        case 'high': return 'border-orange-400';
        case 'medium': return 'border-yellow-400';
        case 'low': return 'border-emerald-400';
      }
    } else {
      const status = columnId as TaskStatus;
      switch (status) {
        case 'not started': return 'border-slate-500';
        case 'in progress': return 'border-blue-400';
        case 'completed': return 'border-emerald-400';
      }
    }
  };

  // Get formatted column name
  const getColumnName = (columnId: string): string => {
    return columnId.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get status badge class
  const getStatusBadgeClass = (status: TaskStatus): string => {
    switch (status) {
      case 'completed': return 'bg-emerald-500 text-emerald-950';
      case 'in progress': return 'bg-blue-500 text-blue-950';
      default: return 'bg-slate-600 text-slate-200';
    }
  };

  // Handle edit task
  const handleEditTask = (taskId: string) => {
    dispatch(openTaskModal(taskId));
  };

  // Handle delete task
  const handleDeleteTask = (taskId: string) => {
    dispatch(openDeleteConfirm(taskId));
  };

  // Show a message if no project is selected
  if (!currentProject) {
    return (
      <div className="h-full flex justify-center items-center">
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold text-blue-50 mb-4">No Project Selected</h2>
          <p className="text-slate-300">Please select a project from the dashboard to view its tasks.</p>
        </div>
      </div>
    );
  }

  return (
    // 🔄 UPDATED: Center the kanban board on large screens
    <div className="h-full flex flex-col">
      <DragDropContext onDragEnd={handleDragEnd}>

        <div
          className="flex-1 overflow-x-auto overflow-y-hidden"
          style={{
            touchAction: 'pan-x pan-y',
            WebkitOverflowScrolling: 'touch'
          }}
        >

          <div className="flex h-full gap-3 px-2 justify-center min-w-full" style={{ minWidth: 'max-content' }}>
            {Object.entries(taskGroups).map(([columnId, columnTasks]) => (
              <div
                key={columnId}
                className={`flex-shrink-0 w-72 rounded-lg border-t-4 h-full ${getColumnColorClass(columnId)}`}
              >
                <div className="bg-slate-800 rounded-b-lg shadow h-full flex flex-col">
                  {/* Column header */}
                  <div className="p-3 border-b border-slate-700 bg-slate-800 flex-shrink-0">
                    <h3 className="font-semibold text-blue-50 text-sm">
                      {getColumnName(columnId)} ({columnTasks.length})
                    </h3>
                  </div>

                  {/* Scrollable tasks area */}
                  <Droppable droppableId={columnId}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 p-2 overflow-y-auto ${snapshot.isDraggingOver ? 'bg-blue-900/30' : 'bg-slate-800'
                          }`}
                        style={{ minHeight: '200px' }}
                      >
                        {columnTasks.length === 0 ? (
                          <div className="flex items-center justify-center h-32">
                            <p className="text-slate-500 text-sm text-center">
                              No tasks
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {columnTasks.map((task: Task, index: number) => (
                              <Draggable
                                key={task.id}
                                draggableId={task.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`${snapshot.isDragging ? 'opacity-70 rotate-3 scale-105' : ''
                                      } transition-all duration-200`}
                                  >
                                    <div className="bg-slate-700 rounded-lg shadow-sm border border-slate-600 hover:shadow-md transition-shadow p-3">
                                      <div className="flex justify-between items-start mb-2">
                                        <h4
                                          className="font-medium text-blue-50 cursor-pointer hover:text-blue-400 line-clamp-2 flex-1 text-sm"
                                          onClick={() => dispatch(openTaskDetail(task.id))}
                                        >
                                          {task.title}
                                        </h4>
                                      </div>

                                      {task.description && (
                                        <p className="mt-2 text-xs text-slate-300 line-clamp-2">
                                          {task.description}
                                        </p>
                                      )}

                                      <div className="mt-3 flex items-center justify-between">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(task.status)}`}>
                                          {task.status}
                                        </span>

                                        <WriteGuard>
                                          <div className="flex space-x-2">
                                            <button
                                              onClick={() => handleEditTask(task.id)}
                                              className="text-blue-400 hover:text-blue-300 text-xs"
                                            >
                                              Edit
                                            </button>
                                            <button
                                              onClick={() => handleDeleteTask(task.id)}
                                              className="text-red-400 hover:text-red-300 text-xs"
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        </WriteGuard>
                                      </div>

                                      {/* Custom fields (if any) */}
                                      {Object.keys(task.customFields).length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-slate-600">
                                          <p className="text-xs text-slate-400 font-medium mb-1">Custom fields:</p>
                                          <div className="text-xs text-slate-300 space-y-1">
                                            {Object.entries(task.customFields).map(([key, value]) => (
                                              <div key={key} className="flex justify-between">
                                                <span className="font-medium">{key}:</span>
                                                <span className="truncate ml-2">{String(value)}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          </div>
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  {/* Add Task Button - Fixed at bottom */}
                  <div className="px-2 py-1.5 border-t border-slate-700 bg-slate-800 flex-shrink-0">
                    {activeInputColumn === columnId ? (
                      <div
                        ref={(el) => createTaskRefs.current[columnId] = el}
                        className="bg-slate-700 rounded-lg p-2"
                      >
                        <textarea
                          value={newTaskInputs[columnId]}
                          onChange={(e) => handleInputChange(columnId, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, columnId)}
                          placeholder="Enter task title..."
                          className="w-full p-2 text-sm border border-slate-600 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-800 text-blue-50 placeholder-slate-500"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex justify-between mt-2">
                          <button
                            onClick={() => handleCreateTask(columnId)}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                          >
                            Add Task
                          </button>
                          <button
                            onClick={handleCancelTask}
                            className="px-3 py-1 text-slate-300 text-sm rounded hover:bg-slate-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <WriteGuard>
                        <button
                          onClick={() => handleShowInput(columnId)}
                          className="w-full py-1.5 px-2 text-blue-400 hover:bg-slate-700 rounded text-sm flex items-center justify-center border-2 border-dashed border-slate-600 hover:border-blue-500 transition-colors"
                        >
                          <span className="text-base mr-1">+</span> Add task
                        </button>
                      </WriteGuard>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanView;