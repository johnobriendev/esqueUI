// src/features/tasks/store/tasksSlice.ts
import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { Task, TaskStatus, TaskPriority, UrgentTaskWithProject } from '../../../types';
import taskService, { TaskServiceError } from '../services/taskService';
import {
  applyPriorityChange,
  applyStatusChange,
  applyReorder,
  applyReorderByStatus,
  revertSingleTask,
  revertMultipleTasks
} from './optimisticUpdates';


interface TasksState {
  items: Task[];
  isLoading: boolean;
  error: string | null;
  urgentTasks: UrgentTaskWithProject[];
  isLoadingUrgentTasks: boolean;
  urgentTasksError: string | null;
}

// Clean initial state
const initialState: TasksState = {
  items: [],
  isLoading: false,
  error: null,
  urgentTasks: [],
  isLoadingUrgentTasks: false,
  urgentTasksError: null
};

// Async thunks for API operations
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (projectId: string, { rejectWithValue }) => {
    try {
      return await taskService.getTasks(projectId);
    } catch (error) {
      return rejectWithValue(error instanceof TaskServiceError ? error.message : 'Failed to fetch tasks');
    }
  }
);

export const createTaskAsync = createAsyncThunk(
  'tasks/createTask',
  async (task: {
    projectId: string;
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    position: number;
    customFields?: Record<string, string | number | boolean>;
    taskId?: string;
  }, { rejectWithValue }) => {
    try {
      return await taskService.createTask({
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        status: task.status || 'not started',
        priority: task.priority || 'low',
        position: task.position,
        customFields: task.customFields,
        ...(task.taskId && { id: task.taskId })
      });
    } catch (error) {
      return rejectWithValue(error instanceof TaskServiceError ? error.message : 'Failed to create task');
    }
  }
);

export const updateTaskAsync = createAsyncThunk(
  'tasks/updateTask',
  async (
    data: {
      projectId: string;
      taskId: string;
      updates: {
        title?: string;
        description?: string;
        status?: TaskStatus;
        priority?: TaskPriority;
        position?: number;
        customFields?: Record<string, string | number | boolean>;
      };
      version?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      return await taskService.updateTask(data.projectId, data.taskId, {
        ...data.updates,
        ...(data.version && { version: data.version })
      });
    } catch (error) {
      if (error instanceof TaskServiceError && error.code === 'VERSION_CONFLICT') {
        return rejectWithValue({ type: 'VERSION_CONFLICT', conflict: error.conflict, message: error.message });
      }
      return rejectWithValue(error instanceof TaskServiceError ? error.message : 'Failed to update task');
    }
  }
);

export const deleteTaskAsync = createAsyncThunk(
  'tasks/deleteTask',
  async (data: {
    projectId: string;
    taskId: string;
  }, { rejectWithValue }) => {
    try {
      await taskService.deleteTask(data.projectId, data.taskId);
      return { taskId: data.taskId };
    } catch (error) {
      return rejectWithValue(error instanceof TaskServiceError ? error.message : 'Failed to delete task');
    }
  }
);

export const deleteTasksAsync = createAsyncThunk(
  'tasks/deleteTasksAsync',
  async (
    data: {
      projectId: string;
      taskIds: string[];
    },
    { rejectWithValue }
  ) => {
    try {
      await taskService.deleteTasks(data.projectId, data.taskIds);
      return { taskIds: data.taskIds };
    } catch (error) {
      return rejectWithValue(error instanceof TaskServiceError ? error.message : 'Failed to delete tasks');
    }
  }
);

export const updateTaskPriorityAsync = createAsyncThunk(
  'tasks/updateTaskPriority',
  async (
    data: {
      projectId: string;
      taskId: string;
      priority: TaskPriority;
      destinationIndex?: number;
      version?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      return await taskService.updateTaskPriority(
        data.projectId,
        data.taskId,
        data.priority,
        data.destinationIndex,
        data.version
      );
    } catch (error) {
      if (error instanceof TaskServiceError && error.code === 'VERSION_CONFLICT') {
        return rejectWithValue({ type: 'VERSION_CONFLICT', conflict: error.conflict, message: error.message });
      }
      return rejectWithValue(error instanceof TaskServiceError ? error.message : 'Failed to update task priority');
    }
  }
);

export const updateTaskStatusAsync = createAsyncThunk(
  'tasks/updateTaskStatus',
  async (
    data: {
      projectId: string;
      taskId: string;
      status: TaskStatus;
      destinationIndex?: number;
      version?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      return await taskService.updateTaskStatus(
        data.projectId,
        data.taskId,
        data.status,
        data.destinationIndex,
        data.version
      );
    } catch (error) {
      if (error instanceof TaskServiceError && error.code === 'VERSION_CONFLICT') {
        return rejectWithValue({ type: 'VERSION_CONFLICT', conflict: error.conflict, message: error.message });
      }
      return rejectWithValue(error instanceof TaskServiceError ? error.message : 'Failed to update task status');
    }
  }
);

export const bulkUpdateTasksAsync = createAsyncThunk(
  'tasks/bulkUpdateTasksAsync',
  async (
    data: {
      projectId: string;
      taskIds: string[];
      updates: Partial<Pick<Task, 'status' | 'priority'>>;
    },
    { rejectWithValue }
  ) => {
    try {
      await taskService.bulkUpdateTasks(data.projectId, { taskIds: data.taskIds, updates: data.updates });
      return { taskIds: data.taskIds, updates: data.updates };
    } catch (error) {
      return rejectWithValue(error instanceof TaskServiceError ? error.message : 'Failed to bulk update tasks');
    }
  }
);

export const reorderTasksAsync = createAsyncThunk(
  'tasks/reorderTasksAsync',
  async (
    data: {
      projectId: string;
      priority: TaskPriority;
      taskIds: string[];
    },
    { rejectWithValue }
  ) => {
    try {
      await taskService.reorderTasks(data.projectId, data.priority, data.taskIds);
      return { priority: data.priority, taskIds: data.taskIds };
    } catch (error) {
      return rejectWithValue(error instanceof TaskServiceError ? error.message : 'Failed to reorder tasks');
    }
  }
);

export const reorderTasksByStatusAsync = createAsyncThunk(
  'tasks/reorderTasksByStatusAsync',
  async (
    data: {
      projectId: string;
      status: TaskStatus;
      taskIds: string[];
    },
    { rejectWithValue }
  ) => {
    try {
      await taskService.reorderTasksByStatus(data.projectId, data.status, data.taskIds);
      return { status: data.status, taskIds: data.taskIds };
    } catch (error) {
      return rejectWithValue(error instanceof TaskServiceError ? error.message : 'Failed to reorder tasks by status');
    }
  }
);

// Fetch urgent tasks across all user's projects
export const fetchUrgentTasks = createAsyncThunk(
  'tasks/fetchUrgentTasks',
  async (_, { rejectWithValue }) => {
    try {
      return await taskService.getUrgentTasks();
    } catch (error) {
      return rejectWithValue(error instanceof TaskServiceError ? error.message : 'Failed to fetch urgent tasks');
    }
  }
);

export const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearTasks: (state) => {
      state.items = [];
    },

    optimisticUpdateTaskPriority: (state, action: PayloadAction<{
      taskId: string;
      priority: TaskPriority;
      destinationIndex?: number;
    }>) => {
      const { taskId, priority, destinationIndex } = action.payload;
      applyPriorityChange(state.items as Task[], taskId, priority, destinationIndex);
    },

    optimisticUpdateTaskStatus: (state, action: PayloadAction<{
      taskId: string;
      status: TaskStatus;
      destinationIndex?: number;
    }>) => {
      const { taskId, status, destinationIndex } = action.payload;
      applyStatusChange(state.items as Task[], taskId, status, destinationIndex);
    },

    optimisticReorderTasks: (state, action: PayloadAction<{
      priority: TaskPriority;
      taskIds: string[];
    }>) => {
      applyReorder(state.items as Task[], action.payload.taskIds);
    },

    optimisticReorderTasksByStatus: (state, action: PayloadAction<{
      status: TaskStatus;
      taskIds: string[];
    }>) => {
      applyReorderByStatus(state.items as Task[], action.payload.taskIds);
    },

    revertOptimisticUpdate: (state, action: PayloadAction<{
      taskId: string;
      originalTask: Task;
    }>) => {
      revertSingleTask(state.items as Task[], action.payload.taskId, action.payload.originalTask);
    },

    revertOptimisticReorder: (state, action: PayloadAction<{
      originalTasks: Task[];
    }>) => {
      revertMultipleTasks(state.items as Task[], action.payload.originalTasks);
    }
  },

  extraReducers: (builder) => {
    builder
      // Fetch tasks
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch tasks';
      })

      // Create task - simple CRUD operation
      .addCase(createTaskAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTaskAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items.push(action.payload);
      })
      .addCase(createTaskAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to create task';
      })

      // Update task - simple CRUD operation
      .addCase(updateTaskAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTaskAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.items.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateTaskAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to update task';
      })

      // Delete task - simple CRUD operation
      .addCase(deleteTaskAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTaskAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = state.items.filter(task => task.id !== action.payload.taskId);
      })
      .addCase(deleteTaskAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to delete task';
      })

      // Update task priority
      .addCase(updateTaskPriorityAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTaskPriorityAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.items.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateTaskPriorityAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to update task priority';
      })

      // Update task status
      .addCase(updateTaskStatusAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTaskStatusAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.items.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateTaskStatusAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to update task status';
      })

      // Bulk update tasks
      .addCase(bulkUpdateTasksAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(bulkUpdateTasksAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        const { taskIds, updates } = action.payload;
        state.items = state.items.map(task => {
          if (taskIds.includes(task.id)) {
            return {
              ...task,
              ...updates,
              updatedAt: new Date().toISOString()
            };
          }
          return task;
        });
      })
      .addCase(bulkUpdateTasksAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to bulk update tasks';
      })

      // Reorder tasks
      .addCase(reorderTasksAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(reorderTasksAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        const { taskIds } = action.payload;
        taskIds.forEach((taskId, index) => {
          const taskIndex = state.items.findIndex(task => task.id === taskId);
          if (taskIndex !== -1) {
            state.items[taskIndex] = {
              ...state.items[taskIndex],
              position: index,
              updatedAt: new Date().toISOString()
            };
          }
        });
      })
      .addCase(reorderTasksAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to reorder tasks';
      })

      // Reorder tasks by status
      .addCase(reorderTasksByStatusAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(reorderTasksByStatusAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        const { taskIds } = action.payload;
        taskIds.forEach((taskId, index) => {
          const taskIndex = state.items.findIndex(task => task.id === taskId);
          if (taskIndex !== -1) {
            state.items[taskIndex] = {
              ...state.items[taskIndex],
              statusPosition: index,
              updatedAt: new Date().toISOString()
            };
          }
        });
      })
      .addCase(reorderTasksByStatusAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to reorder tasks by status';
      })

      // Delete multiple tasks
      .addCase(deleteTasksAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTasksAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        const { taskIds } = action.payload;
        state.items = state.items.filter(task => !taskIds.includes(task.id));
      })
      .addCase(deleteTasksAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to delete tasks';
      })

      // Fetch urgent tasks
      .addCase(fetchUrgentTasks.pending, (state) => {
        state.isLoadingUrgentTasks = true;
        state.urgentTasksError = null;
      })
      .addCase(fetchUrgentTasks.fulfilled, (state, action) => {
        state.isLoadingUrgentTasks = false;
        state.urgentTasks = action.payload;
      })
      .addCase(fetchUrgentTasks.rejected, (state, action) => {
        state.isLoadingUrgentTasks = false;
        state.urgentTasksError = action.payload as string || 'Failed to fetch urgent tasks';
      });
  }
});

// Export actions
export const {
  clearTasks,
  optimisticUpdateTaskPriority,
  optimisticUpdateTaskStatus,
  optimisticReorderTasks,
  optimisticReorderTasksByStatus,
  revertOptimisticUpdate,
  revertOptimisticReorder
} = tasksSlice.actions;

// Export the simple reducer (no more undoable wrapper!)
export default tasksSlice.reducer;

// Simplified selectors - note the state structure change
const selectTasksState = (state: any) => state.tasks; // No more .present!
const selectTasks = (state: any) => state.tasks.items; // Direct access to items
const selectCurrentProjectId = (state: any) => state.projects.currentProject?.id;
const selectFilterConfig = (state: any) => state.ui.filterConfig;
const selectSortConfig = (state: any) => state.ui.sortConfig;

// Memoized selector for project tasks
export const selectProjectTasks = createSelector(
  [selectTasks, selectCurrentProjectId],
  (tasks, projectId) => {
    if (!projectId) return [];
    return tasks.filter((task: Task) => task.projectId === projectId);
  }
);

// Memoized selector for filtered tasks
export const selectFilteredTasks = createSelector(
  [selectProjectTasks, selectFilterConfig],
  (tasks, filterConfig) => {
    return tasks.filter((task: Task) => {
      if (filterConfig.status !== 'all' && task.status !== filterConfig.status) {
        return false;
      }

      if (filterConfig.priority !== 'all' && task.priority !== filterConfig.priority) {
        return false;
      }

      if (filterConfig.searchTerm &&
        !task.title.toLowerCase().includes(filterConfig.searchTerm.toLowerCase())) {
        return false;
      }

      return true;
    });
  }
);

// Memoized selector for sorted and filtered tasks
const priorityRank: Record<TaskPriority, number> = { low: 0, medium: 1, high: 2, urgent: 3 };

export const selectSortedFilteredTasks = createSelector(
  [selectFilteredTasks, selectSortConfig],
  (tasks, sortConfig) => {
    const { field, direction } = sortConfig;
    const multiplier = direction === 'asc' ? 1 : -1;

    return [...tasks].sort((a, b) => {
      if (field === 'createdAt' || field === 'updatedAt') {
        return multiplier * (new Date(a[field]).getTime() - new Date(b[field]).getTime());
      }

      if (field === 'priority') {
        return multiplier * (priorityRank[a.priority as TaskPriority] - priorityRank[b.priority as TaskPriority]);
      }

      if (typeof a[field] === 'string' && typeof b[field] === 'string') {
        return multiplier * a[field].localeCompare(b[field] as string);
      }

      return 0;
    });
  }
);

// Memoized selector for tasks grouped by priority
export const selectTasksByPriority = createSelector(
  [selectFilteredTasks],
  (tasks: Task[]) => {
    const priorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

    return priorities.reduce((acc, priority) => {
      const priorityTasks = tasks
        .filter((task: Task) => task.priority === priority)
        .sort((a: Task, b: Task) => (a.position || 0) - (b.position || 0));

      acc[priority] = priorityTasks;
      return acc;
    }, {} as Record<TaskPriority, Task[]>);
  }
);

// Memoized selector for tasks grouped by status
export const selectTasksByStatus = createSelector(
  [selectFilteredTasks],
  (tasks: Task[]) => {
    const statuses: TaskStatus[] = ['not started', 'in progress', 'completed'];

    return statuses.reduce((acc, status) => {
      const statusTasks = tasks
        .filter((task: Task) => task.status === status)
        .sort((a: Task, b: Task) => (a.statusPosition || 0) - (b.statusPosition || 0));

      acc[status] = statusTasks;
      return acc;
    }, {} as Record<TaskStatus, Task[]>);
  }
);

// Simple loading and error selectors
export const selectTasksLoading = (state: any) => state.tasks.isLoading;
export const selectTasksError = (state: any) => state.tasks.error;

// Urgent tasks selectors
export const selectUrgentTasks = (state: any) => state.tasks.urgentTasks;
export const selectUrgentTasksLoading = (state: any) => state.tasks.isLoadingUrgentTasks;
export const selectUrgentTasksError = (state: any) => state.tasks.urgentTasksError;