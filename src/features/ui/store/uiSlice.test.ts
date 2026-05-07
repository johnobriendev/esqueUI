// src/features/ui/store/uiSlice.test.ts
import { describe, it, expect } from 'vitest';
import uiReducer, {
  setViewMode,
  setKanbanGroupBy,
  setCurrentProjectId,
  setSortConfig,
  setFilterStatus,
  setFilterPriority,
  setSearchTerm,
  openModal,
  closeModal,
} from './uiSlice';
import { UiState } from '../../../types';

describe('uiSlice', () => {
  const initialState: UiState = {
    viewMode: 'list',
    kanbanGroupBy: 'priority',
    sortConfig: {
      field: 'createdAt',
      direction: 'desc',
    },
    filterConfig: {
      status: 'all',
      priority: 'all',
      searchTerm: '',
    },
    currentProjectId: null,
    activeModal: null,
    activeConflicts: [],
    conflictBannerVisible: false,
    backgroundConfig: {
      type: 'random',
      value: '',
      cachedImageUrl: null,
      photographerName: '',
      photographerUrl: '',
    },
  };

  describe('initial state', () => {
    it('should return the initial state', () => {
      expect(uiReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('setViewMode', () => {
    it('should switch to kanban view', () => {
      const actual = uiReducer(initialState, setViewMode('kanban'));
      expect(actual.viewMode).toBe('kanban');
    });

    it('should switch to list view', () => {
      const state = { ...initialState, viewMode: 'kanban' as const };
      const actual = uiReducer(state, setViewMode('list'));
      expect(actual.viewMode).toBe('list');
    });
  });

  describe('setKanbanGroupBy', () => {
    it('should group by status', () => {
      const actual = uiReducer(initialState, setKanbanGroupBy('status'));
      expect(actual.kanbanGroupBy).toBe('status');
    });

    it('should group by priority', () => {
      const state = { ...initialState, kanbanGroupBy: 'status' as const };
      const actual = uiReducer(state, setKanbanGroupBy('priority'));
      expect(actual.kanbanGroupBy).toBe('priority');
    });
  });

  describe('setCurrentProjectId', () => {
    it('should set current project ID', () => {
      const actual = uiReducer(initialState, setCurrentProjectId('project-123'));
      expect(actual.currentProjectId).toBe('project-123');
    });

    it('should allow setting to null', () => {
      const state = { ...initialState, currentProjectId: 'project-123' };
      const actual = uiReducer(state, setCurrentProjectId(null));
      expect(actual.currentProjectId).toBeNull();
    });
  });

  describe('setSortConfig', () => {
    it('should update sort field', () => {
      const actual = uiReducer(initialState, setSortConfig({ field: 'title' }));
      expect(actual.sortConfig.field).toBe('title');
    });

    it('should update sort direction', () => {
      const actual = uiReducer(initialState, setSortConfig({ direction: 'asc' }));
      expect(actual.sortConfig.direction).toBe('asc');
    });

    it('should toggle direction when same field is clicked', () => {
      const state = {
        ...initialState,
        sortConfig: { field: 'title' as const, direction: 'asc' as const },
      };
      const actual = uiReducer(state, setSortConfig({ field: 'title' }));
      expect(actual.sortConfig.direction).toBe('desc');
    });

    it('should toggle back to asc when clicked again', () => {
      const state = {
        ...initialState,
        sortConfig: { field: 'title' as const, direction: 'desc' as const },
      };
      const actual = uiReducer(state, setSortConfig({ field: 'title' }));
      expect(actual.sortConfig.direction).toBe('asc');
    });

    it('should update both field and direction', () => {
      const actual = uiReducer(
        initialState,
        setSortConfig({ field: 'priority', direction: 'asc' })
      );
      expect(actual.sortConfig.field).toBe('priority');
      expect(actual.sortConfig.direction).toBe('asc');
    });
  });

  describe('filter actions', () => {
    describe('setFilterStatus', () => {
      it('should set status filter', () => {
        const actual = uiReducer(initialState, setFilterStatus('completed'));
        expect(actual.filterConfig.status).toBe('completed');
      });

      it('should set to all', () => {
        const actual = uiReducer(initialState, setFilterStatus('all'));
        expect(actual.filterConfig.status).toBe('all');
      });
    });

    describe('setFilterPriority', () => {
      it('should set priority filter', () => {
        const actual = uiReducer(initialState, setFilterPriority('high'));
        expect(actual.filterConfig.priority).toBe('high');
      });

      it('should set to all', () => {
        const actual = uiReducer(initialState, setFilterPriority('all'));
        expect(actual.filterConfig.priority).toBe('all');
      });
    });

    describe('setSearchTerm', () => {
      it('should set search term', () => {
        const actual = uiReducer(initialState, setSearchTerm('test search'));
        expect(actual.filterConfig.searchTerm).toBe('test search');
      });

      it('should clear search term', () => {
        const state = { ...initialState, filterConfig: { ...initialState.filterConfig, searchTerm: 'test' } };
        const actual = uiReducer(state, setSearchTerm(''));
        expect(actual.filterConfig.searchTerm).toBe('');
      });
    });
  });

  describe('openModal', () => {
    it('should open taskModal for new task', () => {
      const actual = uiReducer(initialState, openModal({ type: 'taskModal', taskId: null }));
      expect(actual.activeModal).toEqual({ type: 'taskModal', taskId: null });
    });

    it('should open taskModal for editing', () => {
      const actual = uiReducer(initialState, openModal({ type: 'taskModal', taskId: 'task-123' }));
      expect(actual.activeModal).toEqual({ type: 'taskModal', taskId: 'task-123' });
    });

    it('should open taskDetail', () => {
      const actual = uiReducer(initialState, openModal({ type: 'taskDetail', taskId: 'task-123' }));
      expect(actual.activeModal).toEqual({ type: 'taskDetail', taskId: 'task-123' });
    });

    it('should open taskDetail replacing taskModal', () => {
      const state = { ...initialState, activeModal: { type: 'taskModal' as const, taskId: 'task-123' } };
      const actual = uiReducer(state, openModal({ type: 'taskDetail', taskId: 'task-456' }));
      expect(actual.activeModal).toEqual({ type: 'taskDetail', taskId: 'task-456' });
    });

    it('should open deleteConfirm for single task', () => {
      const actual = uiReducer(initialState, openModal({ type: 'deleteConfirm', taskIds: ['task-123'] }));
      expect(actual.activeModal).toEqual({ type: 'deleteConfirm', taskIds: ['task-123'] });
    });

    it('should open deleteConfirm for multiple tasks', () => {
      const actual = uiReducer(initialState, openModal({ type: 'deleteConfirm', taskIds: ['task-1', 'task-2'] }));
      expect(actual.activeModal).toEqual({ type: 'deleteConfirm', taskIds: ['task-1', 'task-2'] });
    });

    it('should open bulkEdit', () => {
      const actual = uiReducer(initialState, openModal({ type: 'bulkEdit', editType: 'status', taskIds: ['task-1', 'task-2'] }));
      expect(actual.activeModal).toEqual({ type: 'bulkEdit', editType: 'status', taskIds: ['task-1', 'task-2'] });
    });

    it('should open teamModal', () => {
      const actual = uiReducer(initialState, openModal({ type: 'teamModal' }));
      expect(actual.activeModal).toEqual({ type: 'teamModal' });
    });

    it('should open invitationsPanel', () => {
      const actual = uiReducer(initialState, openModal({ type: 'invitationsPanel' }));
      expect(actual.activeModal).toEqual({ type: 'invitationsPanel' });
    });

    it('should open urgentTasks', () => {
      const actual = uiReducer(initialState, openModal({ type: 'urgentTasks' }));
      expect(actual.activeModal).toEqual({ type: 'urgentTasks' });
    });

    it('should open archivedProjects', () => {
      const actual = uiReducer(initialState, openModal({ type: 'archivedProjects' }));
      expect(actual.activeModal).toEqual({ type: 'archivedProjects' });
    });

    it('should open backgroundPicker', () => {
      const actual = uiReducer(initialState, openModal({ type: 'backgroundPicker' }));
      expect(actual.activeModal).toEqual({ type: 'backgroundPicker' });
    });
  });

  describe('closeModal', () => {
    it('should set activeModal to null', () => {
      const state = { ...initialState, activeModal: { type: 'teamModal' as const } };
      const actual = uiReducer(state, closeModal());
      expect(actual.activeModal).toBeNull();
    });
  });
});
