import { v4 as uuidv4 } from 'uuid';
import { TaskConflict, Task } from '../../types';
import { AppDispatch } from '../../app/store';
import { enqueueConflict } from './conflictSlice';

export type Resolution = 'keep_mine' | 'take_theirs' | 'cancel';

const pending = new Map<string, (resolution: Resolution) => void>();

export const settleConflict = (id: string, resolution: Resolution): void => {
  const resolve = pending.get(id);
  if (resolve) {
    pending.delete(id);
    resolve(resolution);
  }
};

export const resolveConflict = (
  dispatch: AppDispatch,
  conflict: TaskConflict,
  userChanges: Partial<Task>
): Promise<Resolution> => {
  const id = uuidv4();
  dispatch(enqueueConflict({ id, conflict, userChanges }));
  return new Promise<Resolution>((resolve) => {
    pending.set(id, resolve);
  });
};
