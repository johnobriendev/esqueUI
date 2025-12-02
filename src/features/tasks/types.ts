// Task-related types

export type TaskStatus = 'not started' | 'in progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
    id: string;
    projectId: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    position: number; // Position within priority group
    statusPosition: number; // Position within status group
    createdAt: string;
    updatedAt: string;
    customFields: Record<string, string | number | boolean>;
    // Collaboration fields from backend
    version: number; // For optimistic locking/conflict detection
    updatedBy: string; // Email of user who last updated this task
}

export interface FilterConfig {
    status: TaskStatus | 'all';
    priority: TaskPriority | 'all';
    searchTerm: string;
}

// Urgent task with project information (for cross-project urgent tasks view)
export interface UrgentTaskWithProject extends Task {
  project: {
    id: string;
    name: string;
    description: string;
  };
}

// Conflict resolution
export interface TaskConflict {
  taskId: string;
  expectedVersion: number;
  currentVersion: number;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
  currentTask: Task;
}

// Structure for task state with redux-undo
export interface TasksState {
  items: Task[];
  isLoading: boolean;
  error: string | null;
  // Conflict tracking
  conflicts: TaskConflict[];
  // Urgent tasks across all projects
  urgentTasks: UrgentTaskWithProject[];
  isLoadingUrgentTasks: boolean;
  urgentTasksError: string | null;
}

// Task permissions
export interface TaskPermissions {
  canRead: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canChangeStatus: boolean;
  canChangePriority: boolean;
  canReorder: boolean;
}
