// Project-related types
import { UserRole } from '../../shared/types/common';

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  userId: string; // Owner of the project
  // Collaboration fields from backend
  userRole: UserRole; // Current user's role in this project
  canWrite: boolean; // Computed permission for quick checks
  // Archive fields from backend
  isArchived: boolean; // Owner archived status
  isUserArchived: boolean; // User's hide status
}

// ProjectsState for managing projects
export interface ProjectsState {
  items: Project[];
  archivedItems: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  isLoadingArchived: boolean;
  error: string | null;
}

// Permission helper types
export interface ProjectPermissions {
  canRead: boolean;
  canWrite: boolean;
  canInvite: boolean;
  canManageTeam: boolean;
  canDeleteProject: boolean;
  isOwner: boolean;
  isEditor: boolean;
  isViewer: boolean;
  userRole: UserRole;
}
