// Shared common types

export interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'owner' | 'editor' | 'viewer';

export type ViewMode = 'list' | 'kanban';
export type KanbanGroupBy = 'priority' | 'status';
export type SortField = 'title' | 'status' | 'priority' | 'createdAt'| 'updatedAt';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
    field: SortField;
    direction: SortDirection;
}
