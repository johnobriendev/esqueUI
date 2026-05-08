import { useAppDispatch } from '../../app/hooks';
import { executeCommand } from '../commands/store/commandSlice';
import {
  createTaskCommand,
  updateTaskCommand,
  updateTaskPriorityCommand,
  updateTaskStatusCommand,
  deleteTaskCommand,
  bulkDeleteTasksCommand,
  bulkUpdateTasksCommand,
  reorderTasksCommand,
  reorderTasksByStatusCommand,
} from '../commands/commands/taskCommands';
import type { ConflictResolver } from '../commands/commands/taskCommands';
import type { Task, TaskPriority, TaskStatus } from '../../types';

export type { ConflictResolver };

export type OpResult = { ok: true } | { ok: false; error: string };

export interface CreateData {
  projectId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  position?: number;
  customFields?: Record<string, string | number | boolean>;
}

export interface UpdateData {
  projectId: string;
  taskId: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  destinationIndex?: number;
  title?: string;
  description?: string;
  position?: number;
  customFields?: Record<string, string | number | boolean>;
}

export interface DeleteData {
  projectId: string;
  taskId: string;
}

export interface BulkDeleteData {
  projectId: string;
  taskIds: string[];
}

export interface BulkUpdateData {
  projectId: string;
  taskIds: string[];
  updates: Partial<Pick<Task, 'status' | 'priority'>>;
}

export type ReorderData =
  | { by: 'priority'; projectId: string; priority: TaskPriority; taskIds: string[] }
  | { by: 'status'; projectId: string; status: TaskStatus; taskIds: string[] };

export function useTaskOperations(deps: { resolveConflict?: ConflictResolver } = {}) {
  const dispatch = useAppDispatch();
  const { resolveConflict } = deps;

  const run = async (cmd: Parameters<typeof executeCommand>[0]): Promise<OpResult> => {
    try {
      await dispatch(executeCommand(cmd)).unwrap();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Unknown error' };
    }
  };

  return {
    create: (data: CreateData) =>
      run(createTaskCommand(data)),

    update: (data: UpdateData): Promise<OpResult> => {
      const { projectId, taskId, priority, status, destinationIndex, title, description, position, customFields } = data;
      const hasGeneralFields = title !== undefined || description !== undefined || customFields !== undefined;

      if (priority !== undefined && !hasGeneralFields && status === undefined) {
        return run(updateTaskPriorityCommand({ projectId, taskId, priority, destinationIndex }, { resolveConflict }));
      }
      if (status !== undefined && !hasGeneralFields && priority === undefined) {
        return run(updateTaskStatusCommand({ projectId, taskId, status, destinationIndex }, { resolveConflict }));
      }
      return run(updateTaskCommand(
        { projectId, taskId, updates: { title, description, status, priority, position, customFields } },
        { resolveConflict }
      ));
    },

    delete: (data: DeleteData) =>
      run(deleteTaskCommand(data)),

    bulkDelete: (data: BulkDeleteData) =>
      run(bulkDeleteTasksCommand(data)),

    bulkUpdate: (data: BulkUpdateData) =>
      run(bulkUpdateTasksCommand(data)),

    reorder: (data: ReorderData): Promise<OpResult> => {
      if (data.by === 'priority') {
        const { projectId, priority, taskIds } = data;
        return run(reorderTasksCommand({ projectId, priority, taskIds }));
      }
      const { projectId, status, taskIds } = data;
      return run(reorderTasksByStatusCommand({ projectId, status, taskIds }));
    },
  };
}
