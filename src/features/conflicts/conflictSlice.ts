import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TaskConflict, Task } from '../../types';

interface PendingConflict {
  id: string;
  conflict: TaskConflict;
  userChanges: Partial<Task>;
}

interface ConflictsState {
  pending: PendingConflict | null;
}

const initialState: ConflictsState = { pending: null };

export const conflictSlice = createSlice({
  name: 'conflicts',
  initialState,
  reducers: {
    enqueueConflict: (state, action: PayloadAction<PendingConflict>) => {
      state.pending = action.payload;
    },
    clearConflict: (state) => {
      state.pending = null;
    },
  },
});

export const { enqueueConflict, clearConflict } = conflictSlice.actions;
export default conflictSlice.reducer;

export const selectPendingConflict = (state: { conflicts: ConflictsState }) =>
  state.conflicts.pending;
