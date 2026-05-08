// src/features/commands/taskCommands.ts
import { UndoableCommand } from '../types';
import {
  createTaskAsync,
  updateTaskAsync,
  deleteTaskAsync,
  deleteTasksAsync,
  bulkUpdateTasksAsync,
  updateTaskPriorityAsync,
  updateTaskStatusAsync,
  reorderTasksAsync,
  reorderTasksByStatusAsync,
  optimisticUpdateTaskPriority,
  optimisticUpdateTaskStatus,
  optimisticReorderTasks,
  optimisticReorderTasksByStatus,
  revertOptimisticUpdate,
  revertOptimisticReorder
} from '../../tasks/store/tasksSlice';
import { Task, TaskStatus, TaskPriority } from '../../../types';
import { AppDispatch } from '../../../app/store';
import { ConflictResolver, Resolution } from '../../conflicts';
import { withOptimisticUpdate } from '../../tasks/store/optimisticUpdates';

export type { ConflictResolver, Resolution };

export interface CommandDeps {
  resolveConflict?: ConflictResolver;
}

// Data interfaces for command parameters
export interface CreateTaskData {
  projectId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  position?: number;
  customFields?: Record<string, string | number | boolean>;
}

export interface UpdateTaskData {
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
}

export interface DeleteTaskData {
  projectId: string;
  taskId: string;
}

export interface BulkDeleteTasksData {
  projectId: string;
  taskIds: string[];
}

export interface UpdateTaskPriorityData {
  projectId: string;
  taskId: string;
  priority: TaskPriority;
  destinationIndex?: number;
}

export interface UpdateTaskStatusData {
  projectId: string;
  taskId: string;
  status: TaskStatus;
  destinationIndex?: number;
}

export interface ReorderTasksData {
  projectId: string;
  priority: TaskPriority;
  taskIds: string[];
}

export interface ReorderTasksByStatusData {
  projectId: string;
  status: TaskStatus;
  taskIds: string[];
}

export interface BulkUpdateTasksData {
  projectId: string;
  taskIds: string[];
  updates: Partial<Pick<Task, 'status' | 'priority'>>;
}

export function nextPositionForPriority(tasks: Task[], priority: TaskPriority, projectId: string): number {
  const group = tasks.filter(t => t.priority === priority && t.projectId === projectId);
  return group.length ? Math.max(...group.map(t => t.position ?? 0)) + 1 : 0;
}

// CREATE TASK COMMAND
export const createTaskCommand = (data: CreateTaskData): UndoableCommand & { capturedCreatedTaskId: string | null } => {
  const cmd = {
    type: 'CREATE_TASK',
    description: `Create task: ${data.title}`,
    capturedCreatedTaskId: null as string | null,

    execute: async (dispatch: AppDispatch, getState: any) => {
      const state = getState();
      const priority = data.priority ?? 'low';
      const position = data.position ?? nextPositionForPriority(state.tasks.items, priority, data.projectId);

      const result = await dispatch(createTaskAsync({
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        status: data.status ?? 'not started',
        priority,
        position,
        customFields: data.customFields ?? {}
      })).unwrap();

      cmd.capturedCreatedTaskId = result.id;
    },

    undo: async (dispatch: AppDispatch) => {
      if (!cmd.capturedCreatedTaskId) throw new Error('Cannot undo: No task ID stored');
      await dispatch(deleteTaskAsync({
        projectId: data.projectId,
        taskId: cmd.capturedCreatedTaskId
      })).unwrap();
    }
  };
  return cmd;
};

// UPDATE TASK COMMAND
export const updateTaskCommand = (data: UpdateTaskData, deps: CommandDeps = {}): UndoableCommand & { capturedPreviousTask: Task | null } => {
  const { resolveConflict } = deps;

  const cmd = {
    type: 'UPDATE_TASK',
    description: `Update task`,
    capturedPreviousTask: null as Task | null,

    execute: async (dispatch: AppDispatch, getState: any) => {
      const state = getState();
      const currentTask = state.tasks.items.find((t: Task) => t.id === data.taskId);
      if (currentTask) {
        cmd.capturedPreviousTask = { ...currentTask };
      }

      const updates = { ...data.updates };
      if (updates.priority && currentTask && currentTask.priority !== updates.priority && updates.position === undefined) {
        updates.position = nextPositionForPriority(state.tasks.items, updates.priority, data.projectId);
      }

      const attemptUpdate = async (retryWithVersion?: number): Promise<void> => {
        try {
          await dispatch(updateTaskAsync({
            projectId: data.projectId,
            taskId: data.taskId,
            updates,
            version: retryWithVersion ?? currentTask?.version
          })).unwrap();
        } catch (error: any) {
          if (error.type === 'VERSION_CONFLICT') {
            if (!resolveConflict) throw error;
            const resolution = await resolveConflict(error.conflict, updates);
            if (resolution === 'keep_mine') {
              await dispatch(updateTaskAsync({
                projectId: data.projectId,
                taskId: data.taskId,
                updates,
                version: error.conflict.currentVersion
              })).unwrap();
            } else if (resolution === 'take_theirs') {
              // task already at server version in Redux
            } else {
              throw new Error('Update cancelled by user');
            }
          } else {
            throw error;
          }
        }
      };

      await attemptUpdate();
    },

    undo: async (dispatch: AppDispatch, getState: any) => {
      if (!cmd.capturedPreviousTask) throw new Error('Cannot undo: No previous task data stored');
      const currentTask = getState().tasks.items.find((t: Task) => t.id === data.taskId);
      await dispatch(updateTaskAsync({
        projectId: data.projectId,
        taskId: data.taskId,
        updates: {
          title: cmd.capturedPreviousTask.title,
          description: cmd.capturedPreviousTask.description ?? undefined,
          status: cmd.capturedPreviousTask.status,
          priority: cmd.capturedPreviousTask.priority,
          position: cmd.capturedPreviousTask.position,
          customFields: cmd.capturedPreviousTask.customFields
        },
        version: currentTask?.version
      })).unwrap();
    }
  };
  return cmd;
};

// DELETE TASK COMMAND
export const deleteTaskCommand = (data: DeleteTaskData): UndoableCommand & { capturedDeletedTask: Task | null } => {
  const cmd = {
    type: 'DELETE_TASK',
    description: `Delete task`,
    capturedDeletedTask: null as Task | null,

    execute: async (dispatch: AppDispatch, getState: any) => {
      const taskToDelete = getState().tasks.items.find((t: Task) => t.id === data.taskId);
      if (taskToDelete) {
        cmd.capturedDeletedTask = { ...taskToDelete };
      }
      await dispatch(deleteTaskAsync({
        projectId: data.projectId,
        taskId: data.taskId
      })).unwrap();
    },

    undo: async (dispatch: AppDispatch) => {
      if (!cmd.capturedDeletedTask) throw new Error('Cannot undo: No deleted task data stored');
      await dispatch(createTaskAsync({
        projectId: data.projectId,
        title: cmd.capturedDeletedTask.title,
        description: cmd.capturedDeletedTask.description ?? undefined,
        status: cmd.capturedDeletedTask.status,
        priority: cmd.capturedDeletedTask.priority,
        position: cmd.capturedDeletedTask.position,
        customFields: cmd.capturedDeletedTask.customFields,
        taskId: cmd.capturedDeletedTask.id
      })).unwrap();
    }
  };
  return cmd;
};


export const bulkDeleteTasksCommand = (data: BulkDeleteTasksData): UndoableCommand & { capturedDeletedTasks: Task[] } => {
  const cmd = {
    type: 'BULK_DELETE_TASKS',
    description: `Delete ${data.taskIds.length} tasks`,
    capturedDeletedTasks: [] as Task[],

    execute: async (dispatch: AppDispatch, getState: any) => {
      const tasksToDelete = getState().tasks.items.filter((t: Task) => data.taskIds.includes(t.id));
      if (tasksToDelete.length === 0) throw new Error('No tasks found for deletion');
      cmd.capturedDeletedTasks = tasksToDelete.map((task: Task) => ({ ...task }));
      await dispatch(deleteTasksAsync({
        projectId: data.projectId,
        taskIds: data.taskIds
      })).unwrap();
    },

    undo: async (dispatch: AppDispatch) => {
      if (cmd.capturedDeletedTasks.length === 0) throw new Error('Cannot undo: No deleted tasks data stored');
      for (const taskData of cmd.capturedDeletedTasks) {
        await dispatch(createTaskAsync({
          projectId: data.projectId,
          title: taskData.title,
          description: taskData.description ?? undefined,
          status: taskData.status,
          priority: taskData.priority,
          position: taskData.position,
          customFields: taskData.customFields,
          taskId: taskData.id
        })).unwrap();
      }
    }
  };
  return cmd;
};


export const updateTaskPriorityCommand = (data: UpdateTaskPriorityData, deps: CommandDeps = {}): UndoableCommand & { capturedPreviousTask: Task | null; capturedHasOptimisticUpdate: boolean } => {
  const { resolveConflict } = deps;

  const cmd = {
    type: 'UPDATE_TASK_PRIORITY',
    description: `Move task to ${data.priority} priority`,
    capturedPreviousTask: null as Task | null,
    capturedHasOptimisticUpdate: false,

    execute: async (dispatch: AppDispatch, getState: any) => {
      const currentTask = getState().tasks.items.find((t: Task) => t.id === data.taskId);
      if (!currentTask) return;

      cmd.capturedPreviousTask = { ...currentTask };
      dispatch(optimisticUpdateTaskPriority({
        taskId: data.taskId,
        priority: data.priority,
        destinationIndex: data.destinationIndex
      }));
      cmd.capturedHasOptimisticUpdate = true;

      try {
        await dispatch(updateTaskPriorityAsync({
          projectId: data.projectId,
          taskId: data.taskId,
          priority: data.priority,
          destinationIndex: data.destinationIndex,
          version: currentTask.version
        })).unwrap();
      } catch (error: any) {
        if (error.type === 'VERSION_CONFLICT') {
          if (!resolveConflict) throw error;
          const resolution = await resolveConflict(error.conflict, { priority: data.priority });
          if (resolution === 'keep_mine') {
            await dispatch(updateTaskPriorityAsync({
              projectId: data.projectId,
              taskId: data.taskId,
              priority: data.priority,
              destinationIndex: data.destinationIndex,
              version: error.conflict.currentVersion
            })).unwrap();
          } else {
            dispatch(revertOptimisticUpdate({ taskId: data.taskId, originalTask: cmd.capturedPreviousTask! }));
            if (resolution === 'cancel') throw new Error('Priority update cancelled by user');
          }
        } else {
          dispatch(revertOptimisticUpdate({ taskId: data.taskId, originalTask: cmd.capturedPreviousTask! }));
          throw error;
        }
      }
    },

    undo: async (dispatch: AppDispatch, getState: any) => {
      if (!cmd.capturedPreviousTask) throw new Error('Cannot undo: No previous task data stored');

      dispatch(optimisticUpdateTaskPriority({
        taskId: data.taskId,
        priority: cmd.capturedPreviousTask.priority,
        destinationIndex: cmd.capturedPreviousTask.position
      }));

      try {
        const currentTask = getState().tasks.items.find((t: Task) => t.id === data.taskId);
        await dispatch(updateTaskPriorityAsync({
          projectId: data.projectId,
          taskId: data.taskId,
          priority: cmd.capturedPreviousTask.priority,
          destinationIndex: cmd.capturedPreviousTask.position,
          version: currentTask?.version
        })).unwrap();
      } catch (error) {
        const currentTask = getState().tasks.items.find((t: Task) => t.id === data.taskId);
        if (currentTask) {
          dispatch(revertOptimisticUpdate({ taskId: data.taskId, originalTask: currentTask }));
        }
        throw error;
      }
    }
  };
  return cmd;
};

// UPDATE TASK STATUS COMMAND
export const updateTaskStatusCommand = (data: UpdateTaskStatusData, deps: CommandDeps = {}): UndoableCommand & { capturedPreviousTask: Task | null; capturedHasOptimisticUpdate: boolean } => {
  const { resolveConflict } = deps;

  const cmd = {
    type: 'UPDATE_TASK_STATUS',
    description: `Move task to ${data.status} status`,
    capturedPreviousTask: null as Task | null,
    capturedHasOptimisticUpdate: false,

    execute: async (dispatch: AppDispatch, getState: any) => {
      const currentTask = getState().tasks.items.find((t: Task) => t.id === data.taskId);
      if (!currentTask) return;

      cmd.capturedPreviousTask = { ...currentTask };
      dispatch(optimisticUpdateTaskStatus({
        taskId: data.taskId,
        status: data.status,
        destinationIndex: data.destinationIndex
      }));
      cmd.capturedHasOptimisticUpdate = true;

      try {
        await dispatch(updateTaskStatusAsync({
          projectId: data.projectId,
          taskId: data.taskId,
          status: data.status,
          destinationIndex: data.destinationIndex,
          version: currentTask.version
        })).unwrap();
      } catch (error: any) {
        if (error.type === 'VERSION_CONFLICT') {
          if (!resolveConflict) throw error;
          const resolution = await resolveConflict(error.conflict, { status: data.status });
          if (resolution === 'keep_mine') {
            await dispatch(updateTaskStatusAsync({
              projectId: data.projectId,
              taskId: data.taskId,
              status: data.status,
              destinationIndex: data.destinationIndex,
              version: error.conflict.currentVersion
            })).unwrap();
          } else {
            dispatch(revertOptimisticUpdate({ taskId: data.taskId, originalTask: cmd.capturedPreviousTask! }));
            if (resolution === 'cancel') throw new Error('Status update cancelled by user');
          }
        } else {
          dispatch(revertOptimisticUpdate({ taskId: data.taskId, originalTask: cmd.capturedPreviousTask! }));
          throw error;
        }
      }
    },

    undo: async (dispatch: AppDispatch, getState: any) => {
      if (!cmd.capturedPreviousTask) throw new Error('Cannot undo: No previous task data stored');

      dispatch(optimisticUpdateTaskStatus({
        taskId: data.taskId,
        status: cmd.capturedPreviousTask.status,
        destinationIndex: cmd.capturedPreviousTask.position
      }));

      try {
        const currentTask = getState().tasks.items.find((t: Task) => t.id === data.taskId);
        await dispatch(updateTaskStatusAsync({
          projectId: data.projectId,
          taskId: data.taskId,
          status: cmd.capturedPreviousTask.status,
          destinationIndex: cmd.capturedPreviousTask.position,
          version: currentTask?.version
        })).unwrap();
      } catch (error) {
        const currentTask = getState().tasks.items.find((t: Task) => t.id === data.taskId);
        if (currentTask) {
          dispatch(revertOptimisticUpdate({ taskId: data.taskId, originalTask: currentTask }));
        }
        throw error;
      }
    }
  };
  return cmd;
};

// REORDER TASKS COMMAND
export const reorderTasksCommand = (data: ReorderTasksData): UndoableCommand & { capturedPreviousOrder: string[]; capturedOriginalTasks: Task[] } => {
  const cmd = {
    type: 'REORDER_TASKS',
    description: `Reorder tasks in ${data.priority} priority`,
    capturedPreviousOrder: [] as string[],
    capturedOriginalTasks: [] as Task[],

    execute: async (dispatch: AppDispatch, getState: any) => {
      const currentTasks = getState().tasks.items
        .filter((t: Task) => t.priority === data.priority && t.projectId === data.projectId)
        .sort((a: Task, b: Task) => (a.position || 0) - (b.position || 0));

      cmd.capturedPreviousOrder = currentTasks.map((t: Task) => t.id);
      cmd.capturedOriginalTasks = currentTasks.map((t: Task) => ({ ...t }));

      await withOptimisticUpdate(
        () => dispatch(optimisticReorderTasks({ priority: data.priority, taskIds: data.taskIds })),
        () => dispatch(reorderTasksAsync({ projectId: data.projectId, priority: data.priority, taskIds: data.taskIds })).unwrap(),
        () => dispatch(revertOptimisticReorder({ originalTasks: cmd.capturedOriginalTasks }))
      );
    },

    undo: async (dispatch: AppDispatch) => {
      if (cmd.capturedPreviousOrder.length === 0) throw new Error('Cannot undo: No previous order stored');

      await withOptimisticUpdate(
        () => dispatch(optimisticReorderTasks({ priority: data.priority, taskIds: cmd.capturedPreviousOrder })),
        () => dispatch(reorderTasksAsync({ projectId: data.projectId, priority: data.priority, taskIds: cmd.capturedPreviousOrder })).unwrap(),
        () => dispatch(revertOptimisticReorder({ originalTasks: cmd.capturedOriginalTasks }))
      );
    }
  };
  return cmd;
};

// REORDER TASKS BY STATUS COMMAND
export const reorderTasksByStatusCommand = (data: ReorderTasksByStatusData): UndoableCommand & { capturedPreviousOrder: string[]; capturedOriginalTasks: Task[] } => {
  const cmd = {
    type: 'REORDER_TASKS_BY_STATUS',
    description: `Reorder tasks in ${data.status} status`,
    capturedPreviousOrder: [] as string[],
    capturedOriginalTasks: [] as Task[],

    execute: async (dispatch: AppDispatch, getState: any) => {
      const currentTasks = getState().tasks.items
        .filter((t: Task) => t.status === data.status && t.projectId === data.projectId)
        .sort((a: Task, b: Task) => (a.statusPosition || 0) - (b.statusPosition || 0));

      cmd.capturedPreviousOrder = currentTasks.map((t: Task) => t.id);
      cmd.capturedOriginalTasks = currentTasks.map((t: Task) => ({ ...t }));

      await withOptimisticUpdate(
        () => dispatch(optimisticReorderTasksByStatus({ status: data.status, taskIds: data.taskIds })),
        () => dispatch(reorderTasksByStatusAsync({ projectId: data.projectId, status: data.status, taskIds: data.taskIds })).unwrap(),
        () => dispatch(revertOptimisticReorder({ originalTasks: cmd.capturedOriginalTasks }))
      );
    },

    undo: async (dispatch: AppDispatch) => {
      if (cmd.capturedPreviousOrder.length === 0) throw new Error('Cannot undo: No previous order stored');

      await withOptimisticUpdate(
        () => dispatch(optimisticReorderTasksByStatus({ status: data.status, taskIds: cmd.capturedPreviousOrder })),
        () => dispatch(reorderTasksByStatusAsync({ projectId: data.projectId, status: data.status, taskIds: cmd.capturedPreviousOrder })).unwrap(),
        () => dispatch(revertOptimisticReorder({ originalTasks: cmd.capturedOriginalTasks }))
      );
    }
  };
  return cmd;
};


export const bulkUpdateTasksCommand = (data: BulkUpdateTasksData): UndoableCommand & { capturedPreviousTasksData: Array<{ id: string; originalData: Pick<Task, 'status' | 'priority'> }> } => {
  const cmd = {
    type: 'BULK_UPDATE_TASKS',
    description: `Bulk update ${data.taskIds.length} tasks`,
    capturedPreviousTasksData: [] as Array<{ id: string; originalData: Pick<Task, 'status' | 'priority'> }>,

    execute: async (dispatch: AppDispatch, getState: any) => {
      const tasksToUpdate = getState().tasks.items.filter((t: Task) => data.taskIds.includes(t.id));
      if (tasksToUpdate.length === 0) throw new Error('No tasks found for bulk update');

      cmd.capturedPreviousTasksData = tasksToUpdate.map((task: Task) => ({
        id: task.id,
        originalData: { status: task.status, priority: task.priority }
      }));

      await dispatch(bulkUpdateTasksAsync({
        projectId: data.projectId,
        taskIds: data.taskIds,
        updates: data.updates
      })).unwrap();
    },

    undo: async (dispatch: AppDispatch) => {
      if (cmd.capturedPreviousTasksData.length === 0) throw new Error('Cannot undo: No previous task data stored');
      for (const taskData of cmd.capturedPreviousTasksData) {
        await dispatch(bulkUpdateTasksAsync({
          projectId: data.projectId,
          taskIds: [taskData.id],
          updates: taskData.originalData
        })).unwrap();
      }
    }
  };
  return cmd;
};

// Export all commands
export const taskCommands = {
  createTask: createTaskCommand,
  updateTask: updateTaskCommand,
  deleteTask: deleteTaskCommand,
  bulkDeleteTasks: bulkDeleteTasksCommand,
  bulkUpdateTasks: bulkUpdateTasksCommand,
  updateTaskPriority: updateTaskPriorityCommand,
  updateTaskStatus: updateTaskStatusCommand,
  reorderTasks: reorderTasksCommand,
  reorderTasksByStatus: reorderTasksByStatusCommand
};
