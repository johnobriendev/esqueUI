import { TaskConflict, Task } from '../../types';
import { AppDispatch } from '../../app/store';
import { resolveConflict } from './conflictService';

export type { Resolution } from './conflictService';

export type ConflictResolver = (
  conflict: TaskConflict,
  userChanges: Partial<Task>
) => Promise<import('./conflictService').Resolution>;

export const createModalConflictResolver = (dispatch: AppDispatch): ConflictResolver =>
  (conflict, userChanges) => resolveConflict(dispatch, conflict, userChanges);

export const createFixedResolver = (
  resolution: import('./conflictService').Resolution
): ConflictResolver =>
  async () => resolution;
