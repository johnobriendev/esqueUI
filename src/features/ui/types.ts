// UI state types
import { ViewMode, KanbanGroupBy, SortConfig } from '../../shared/types/common';
import { FilterConfig } from '../tasks/types';

export type ActiveModal =
  | { type: 'taskModal'; taskId: string | null }
  | { type: 'taskDetail'; taskId: string }
  | { type: 'deleteConfirm'; taskIds: string[] }
  | { type: 'bulkEdit'; editType: 'status' | 'priority'; taskIds: string[] }
  | { type: 'teamModal' }
  | { type: 'invitationsPanel' }
  | { type: 'urgentTasks' }
  | { type: 'archivedProjects' }
  | { type: 'backgroundPicker' }
  | null;

export interface UiState {
  viewMode: ViewMode;
  kanbanGroupBy: KanbanGroupBy;
  sortConfig: SortConfig;
  filterConfig: FilterConfig;
  currentProjectId: string | null;
  activeModal: ActiveModal;

  activeConflicts: string[];
  conflictBannerVisible: boolean;

  backgroundConfig: {
    type: 'random' | 'image' | 'color';
    value: string;
    cachedImageUrl: string | null;
    photographerName: string;
    photographerUrl: string;
  };
}
