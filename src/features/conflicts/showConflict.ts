import { v4 as uuidv4 } from 'uuid';
import { TaskConflict, Task } from '../../types';
import { AppDispatch } from '../../app/store';
import { enqueueConflict } from './conflictSlice';
import { waitForResolution } from './conflictRegistry';

type Resolution = 'keep_mine' | 'take_theirs' | 'cancel';

export const showConflict = async (
  dispatch: AppDispatch,
  conflict: TaskConflict,
  userChanges: Partial<Task>
): Promise<Resolution> => {
  const id = uuidv4();
  dispatch(enqueueConflict({ id, conflict, userChanges }));
  return waitForResolution(id);
};
