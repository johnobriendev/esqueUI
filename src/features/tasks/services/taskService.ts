//src/services/taskService.ts

import { AxiosError } from 'axios';
import api from '../../../shared/lib/api';
import { Task, TaskStatus, TaskPriority, UrgentTaskWithProject, TaskConflict } from '../../../types';

export class TaskServiceError extends Error {
  constructor(
    public readonly code: 'VERSION_CONFLICT' | 'NOT_FOUND' | 'FORBIDDEN' | 'SERVER_ERROR' | 'NETWORK_ERROR',
    message: string,
    public readonly conflict?: TaskConflict
  ) {
    super(message);
    this.name = 'TaskServiceError';
  }
}

function toTaskServiceError(error: unknown): TaskServiceError {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    const status = error.response?.status;
    if (status === 409 && data?.error === 'VERSION_CONFLICT') {
      return new TaskServiceError('VERSION_CONFLICT', data.message, data.conflict);
    }
    if (status === 404) return new TaskServiceError('NOT_FOUND', data?.message || 'Not found');
    if (status === 403) return new TaskServiceError('FORBIDDEN', data?.message || 'Forbidden');
    if (!error.response) return new TaskServiceError('NETWORK_ERROR', 'Network error');
    return new TaskServiceError('SERVER_ERROR', data?.message || 'Request failed');
  }
  return new TaskServiceError('SERVER_ERROR', 'Unknown error');
}

// Types for API requests
interface CreateTaskRequest {
  id?: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  position?: number;
  customFields?: Record<string, string | number | boolean>;
}

interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  position?: number;
  customFields?: Record<string, string | number | boolean>;
  version?: number;
}

interface UpdateTaskPriorityRequest {
  priority: TaskPriority;
  destinationIndex?: number;
  version?: number;
}

// Task API service
const taskService = {
  getTasks: async (projectId: string): Promise<Task[]> => {
    try {
      const response = await api.get(`/projects/${projectId}/tasks`);
      return response.data;
    } catch (error) { throw toTaskServiceError(error); }
  },

  getTask: async (projectId: string, taskId: string): Promise<Task> => {
    try {
      const response = await api.get(`/projects/${projectId}/tasks/${taskId}`);
      return response.data;
    } catch (error) { throw toTaskServiceError(error); }
  },

  createTask: async (data: CreateTaskRequest): Promise<Task> => {
    try {
      const payload = {
        ...data,
        description: data.description === "" ? undefined : data.description,
        customFields: data.customFields || {}
      };
      const response = await api.post(`/projects/${data.projectId}/tasks`, payload);
      return response.data;
    } catch (error) { throw toTaskServiceError(error); }
  },

  updateTask: async (
    projectId: string,
    taskId: string,
    updates: UpdateTaskRequest
  ): Promise<Task> => {
    try {
      const response = await api.patch(`/projects/${projectId}/tasks/${taskId}`, updates);
      return response.data;
    } catch (error) { throw toTaskServiceError(error); }
  },

  updateTaskPriority: async (
    projectId: string,
    taskId: string,
    priority: TaskPriority,
    destinationIndex?: number,
    version?: number
  ): Promise<Task> => {
    try {
      const response = await api.patch(`/projects/${projectId}/tasks/${taskId}/priority`, {
        priority,
        destinationIndex,
        ...(version && { version })
      });
      return response.data;
    } catch (error) { throw toTaskServiceError(error); }
  },

  updateTaskStatus: async (
    projectId: string,
    taskId: string,
    status: TaskStatus,
    destinationIndex?: number,
    version?: number
  ): Promise<Task> => {
    try {
      const response = await api.patch(`/projects/${projectId}/tasks/${taskId}/status`, {
        status,
        destinationIndex,
        ...(version && { version })
      });
      return response.data;
    } catch (error) { throw toTaskServiceError(error); }
  },

  deleteTask: async (projectId: string, taskId: string): Promise<void> => {
    try {
      await api.delete(`/projects/${projectId}/tasks/${taskId}`);
    } catch (error) { throw toTaskServiceError(error); }
  },

  deleteTasks: async (projectId: string, taskIds: string[]): Promise<void> => {
    try {
      await api.delete(`/projects/${projectId}/tasks`, { data: { taskIds } });
    } catch (error) { throw toTaskServiceError(error); }
  },

  reorderTasks: async (
    projectId: string,
    _priority: TaskPriority,
    taskIds: string[]
  ): Promise<void> => {
    try {
      const tasks = taskIds.map((id, index) => ({ id, position: index }));
      await api.put(`/projects/${projectId}/tasks/reorder`, { tasks, groupBy: 'priority' });
    } catch (error) { throw toTaskServiceError(error); }
  },

  reorderTasksByStatus: async (
    projectId: string,
    _status: TaskStatus,
    taskIds: string[]
  ): Promise<void> => {
    try {
      const tasks = taskIds.map((id, index) => ({ id, statusPosition: index }));
      await api.put(`/projects/${projectId}/tasks/reorder`, { tasks, groupBy: 'status' });
    } catch (error) { throw toTaskServiceError(error); }
  },

  bulkUpdateTasks: async (
    projectId: string,
    data: {
      taskIds: string[],
      updates: Partial<Pick<Task, 'status' | 'priority'>>
    }
  ): Promise<void> => {
    try {
      await api.put(`/projects/${projectId}/tasks/bulk`, data);
    } catch (error) { throw toTaskServiceError(error); }
  },

  getUrgentTasks: async (): Promise<UrgentTaskWithProject[]> => {
    try {
      const response = await api.get('/tasks/urgent');
      return response.data;
    } catch (error) { throw toTaskServiceError(error); }
  }
};

export default taskService;