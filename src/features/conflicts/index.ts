import { TaskConflict, Task } from '../../types';
import { AppDispatch } from '../../app/store';
import { resolveConflict } from './conflictService';

export type { Resolution } from './conflictService';

export type ConflictResolver = (
  dispatch: AppDispatch,
  getState: () => unknown,
  conflict: TaskConflict,
  userChanges: Partial<Task>
) => Promise<import('./conflictService').Resolution>;

export const modalConflictResolver: ConflictResolver = resolveConflict;

export const createFixedResolver = (
  resolution: import('./conflictService').Resolution
): ConflictResolver =>
  async () => resolution;
