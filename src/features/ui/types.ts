// UI state types
import { ViewMode, KanbanGroupBy, SortConfig } from '../../shared/types/common';
import { FilterConfig } from '../tasks/types';

// UI state structure with collaboration modals
export interface UiState {
  viewMode: ViewMode;
  kanbanGroupBy: KanbanGroupBy;
  sortConfig: SortConfig;
  filterConfig: FilterConfig;
  isTaskModalOpen: boolean;
  editingTaskId: string | null;
  isTaskDetailOpen: boolean;
  viewingTaskId: string | null;
  isDeleteConfirmOpen: boolean;
  deletingTaskId: string | null;
  deletingTaskIds: string[];
  isBulkEditOpen: boolean;
  bulkEditType: 'status' | 'priority' | null;
  selectedTaskIds: string[];
  currentProjectId: string | null;

  // Collaboration UI state
  isTeamModalOpen: boolean;
  isInviteModalOpen: boolean;
  isInvitationsPanelOpen: boolean;

  // Conflict resolution UI
  activeConflicts: string[]; // Task IDs with active conflicts
  conflictBannerVisible: boolean;

  // Comments UI state
  isDeleteCommentModalOpen: boolean;
  deletingCommentId: string | null;

  // Urgent tasks modal
  isUrgentTasksModalOpen: boolean;

  // Archived projects modal
  isArchivedProjectsModalOpen: boolean;
}
