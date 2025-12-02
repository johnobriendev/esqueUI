// API Error types
import { UserRole } from './common';
import { Task } from '../../features/tasks/types';

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

export interface VersionConflictError extends ApiError {
  status: 409;
  code: 'VERSION_CONFLICT';
  currentTask: Task;
  updatedBy: string;
}

export interface PermissionError extends ApiError {
  status: 403;
  code: 'PERMISSION_DENIED';
  requiredRole: UserRole;
  userRole: UserRole;
}
