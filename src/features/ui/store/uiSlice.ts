//src/features/ui/store/uiSlice.ts

import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit';
import { REHYDRATE } from 'redux-persist';
import {
  ViewMode,
  KanbanGroupBy,
  SortField,
  SortDirection,
  SortConfig,
  FilterConfig,
  TaskStatus,
  TaskPriority,
  UiState,
  ActiveModal
} from '../../../types';

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
  activeModal: null,
  activeConflicts: [],
  conflictBannerVisible: false,
  backgroundConfig: { type: 'random', value: '', cachedImageUrl: null, photographerName: '', photographerUrl: '' },
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setViewMode: (state, action: PayloadAction<ViewMode>) => {
      state.viewMode = action.payload;
    },

    setKanbanGroupBy: (state, action: PayloadAction<KanbanGroupBy>) => {
      state.kanbanGroupBy = action.payload;
    },

    setSortConfig: (state, action: PayloadAction<Partial<SortConfig>>) => {
      if (action.payload.field === state.sortConfig.field && !action.payload.direction) {
        state.sortConfig.direction = state.sortConfig.direction === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortConfig = { ...state.sortConfig, ...action.payload };
      }
    },

    setFilterStatus: (state, action: PayloadAction<TaskStatus | 'all'>) => {
      state.filterConfig.status = action.payload;
    },

    setFilterPriority: (state, action: PayloadAction<TaskPriority | 'all'>) => {
      state.filterConfig.priority = action.payload;
    },

    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.filterConfig.searchTerm = action.payload;
    },

    openModal: (state, action: PayloadAction<Exclude<ActiveModal, null>>) => {
      state.activeModal = action.payload;
    },

    closeModal: (state) => {
      state.activeModal = null;
    },

    setBackgroundConfig: (state, action: PayloadAction<UiState['backgroundConfig']>) => {
      state.backgroundConfig = action.payload;
    },

    setCachedImageUrl: (state, action: PayloadAction<string | null>) => {
      state.backgroundConfig.cachedImageUrl = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action: any) => {
      const incoming = action.payload;
      if (incoming?.backgroundConfig) {
        const isImage = incoming.backgroundConfig.type === 'image';
        state.backgroundConfig = {
          ...incoming.backgroundConfig,
          cachedImageUrl: isImage ? incoming.backgroundConfig.cachedImageUrl : null,
          photographerName: isImage ? incoming.backgroundConfig.photographerName : '',
          photographerUrl: isImage ? incoming.backgroundConfig.photographerUrl : '',
        };
      }
    });
  },
});

export const {
  setViewMode,
  setKanbanGroupBy,
  setSortConfig,
  setFilterStatus,
  setFilterPriority,
  setSearchTerm,
  openModal,
  closeModal,
  setBackgroundConfig,
  setCachedImageUrl,
} = uiSlice.actions;

export default uiSlice.reducer;

// Selectors
export const selectViewMode = (state: { ui: UiState }) => state.ui.viewMode;
export const selectKanbanGroupBy = (state: { ui: UiState }) => state.ui.kanbanGroupBy;
export const selectActiveModal = (state: { ui: UiState }) => state.ui.activeModal;

export const selectSortConfig = createSelector(
  (state: { ui: UiState }) => state.ui.sortConfig,
  (sortConfig) => sortConfig
);

export const selectFilterConfig = createSelector(
  (state: { ui: UiState }) => state.ui.filterConfig,
  (filterConfig) => filterConfig
);

export const selectBackgroundConfig = createSelector(
  (state: { ui: UiState }) => state.ui.backgroundConfig,
  (backgroundConfig) => backgroundConfig
);
