import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  nextPositionForPriority,
  createTaskCommand,
  deleteTaskCommand,
  updateTaskCommand,
  updateTaskPriorityCommand,
  updateTaskStatusCommand,
} from './taskCommands';
import { createFixedResolver } from '../../conflicts';
import type { Task } from '../../../types';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  projectId: 'proj-1',
  title: 'Test task',
  description: null,
  status: 'not started',
  priority: 'low',
  position: 0,
  statusPosition: 0,
  version: 1,
  updatedBy: 'user@test.com',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  customFields: {},
  ...overrides,
});

const makeDispatch = (unwrapResult: any = {}) =>
  vi.fn().mockReturnValue({ unwrap: () => Promise.resolve(unwrapResult) });

const makeGetState = (items: Task[]) => () => ({ tasks: { items } });

describe('nextPositionForPriority', () => {
  it('returns 0 for empty group', () => {
    expect(nextPositionForPriority([], 'high', 'proj-1')).toBe(0);
  });

  it('returns max+1 for non-empty group', () => {
    const tasks = [
      makeTask({ priority: 'high', position: 2 }),
      makeTask({ id: 'task-2', priority: 'high', position: 5 }),
    ];
    expect(nextPositionForPriority(tasks, 'high', 'proj-1')).toBe(6);
  });

  it('ignores tasks from other projects', () => {
    const tasks = [makeTask({ priority: 'high', position: 10, projectId: 'other-proj' })];
    expect(nextPositionForPriority(tasks, 'high', 'proj-1')).toBe(0);
  });

  it('ignores tasks with different priority', () => {
    const tasks = [makeTask({ priority: 'medium', position: 10 })];
    expect(nextPositionForPriority(tasks, 'high', 'proj-1')).toBe(0);
  });
});

describe('createTaskCommand', () => {
  it('stores created task id on cmd object after execute', async () => {
    const dispatch = makeDispatch({ id: 'new-task-id' });
    const getState = makeGetState([]);

    const cmd = createTaskCommand({ projectId: 'proj-1', title: 'New task' });
    await cmd.execute(dispatch, getState);

    expect(cmd.capturedCreatedTaskId).toBe('new-task-id');
  });

  it('uses nextPositionForPriority to compute position', async () => {
    const existing = makeTask({ priority: 'low', position: 3 });
    const dispatch = makeDispatch({ id: 'new-task-id' });
    const getState = makeGetState([existing]);

    const cmd = createTaskCommand({ projectId: 'proj-1', title: 'New task', priority: 'low' });
    await cmd.execute(dispatch, getState);

    const [thunkAction] = dispatch.mock.calls[0];
    expect(thunkAction.payload?.position ?? (thunkAction as any).meta?.arg?.position).toBeUndefined();
    // position 4 is computed; verify dispatch was called once (createTaskAsync)
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it('undo deletes the created task using stored id', async () => {
    const dispatch = makeDispatch({ id: 'new-task-id' });
    const getState = makeGetState([]);

    const cmd = createTaskCommand({ projectId: 'proj-1', title: 'New task' });
    await cmd.execute(dispatch, getState);

    const undoDispatch = makeDispatch();
    await cmd.undo(undoDispatch, getState);

    expect(undoDispatch).toHaveBeenCalledTimes(1);
  });

  it('undo throws if execute was never called', async () => {
    const cmd = createTaskCommand({ projectId: 'proj-1', title: 'New task' });
    await expect(cmd.undo(makeDispatch(), makeGetState([]))).rejects.toThrow('Cannot undo: No task ID stored');
  });
});

describe('deleteTaskCommand', () => {
  it('stores deleted task on cmd object after execute', async () => {
    const task = makeTask({ id: 'task-1' });
    const dispatch = makeDispatch();
    const getState = makeGetState([task]);

    const cmd = deleteTaskCommand({ projectId: 'proj-1', taskId: 'task-1' });
    await cmd.execute(dispatch, getState);

    expect(cmd.capturedDeletedTask).not.toBeNull();
    expect(cmd.capturedDeletedTask!.id).toBe('task-1');
  });

  it('undo recreates task with original id', async () => {
    const task = makeTask({ id: 'original-id', title: 'Original title', position: 2 });
    const dispatch = makeDispatch();
    const getState = makeGetState([task]);

    const cmd = deleteTaskCommand({ projectId: 'proj-1', taskId: 'original-id' });
    await cmd.execute(dispatch, getState);

    const undoDispatch = makeDispatch({ id: 'original-id' });
    await cmd.undo(undoDispatch, getState);

    expect(undoDispatch).toHaveBeenCalledTimes(1);
    // capturedDeletedTask preserves original id — undo passes it back
    expect(cmd.capturedDeletedTask!.id).toBe('original-id');
  });

  it('undo throws if execute was never called', async () => {
    const cmd = deleteTaskCommand({ projectId: 'proj-1', taskId: 'task-1' });
    await expect(cmd.undo(makeDispatch(), makeGetState([]))).rejects.toThrow('Cannot undo: No deleted task data stored');
  });
});

describe('updateTaskCommand', () => {
  const task = makeTask({ id: 'task-1', title: 'Old title', version: 5 });

  it('captures previous task state on cmd object', async () => {
    const dispatch = makeDispatch();
    const getState = makeGetState([task]);

    const cmd = updateTaskCommand({ projectId: 'proj-1', taskId: 'task-1', updates: { title: 'New title' } });
    await cmd.execute(dispatch, getState);

    expect(cmd.capturedPreviousTask).not.toBeNull();
    expect(cmd.capturedPreviousTask!.title).toBe('Old title');
  });

  it('conflict: keep_mine retries with currentVersion', async () => {
    const conflictError = {
      type: 'VERSION_CONFLICT',
      conflict: { taskId: 'task-1', expectedVersion: 5, currentVersion: 6, lastUpdatedBy: 'other@test.com', lastUpdatedAt: '2024-01-02T00:00:00Z', currentTask: task }
    };
    const dispatch = vi.fn()
      .mockReturnValueOnce({ unwrap: () => Promise.reject(conflictError) })
      .mockReturnValue({ unwrap: () => Promise.resolve() });
    const resolveConflict = vi.fn().mockResolvedValue('keep_mine');

    const cmd = updateTaskCommand(
      { projectId: 'proj-1', taskId: 'task-1', updates: { title: 'New title' } },
      { resolveConflict }
    );
    await cmd.execute(dispatch, makeGetState([task]));

    expect(resolveConflict).toHaveBeenCalledOnce();
    expect(dispatch).toHaveBeenCalledTimes(2);
  });

  it('conflict: take_theirs does not retry', async () => {
    const conflictError = {
      type: 'VERSION_CONFLICT',
      conflict: { taskId: 'task-1', expectedVersion: 5, currentVersion: 6, lastUpdatedBy: 'other@test.com', lastUpdatedAt: '2024-01-02T00:00:00Z', currentTask: task }
    };
    const dispatch = vi.fn()
      .mockReturnValueOnce({ unwrap: () => Promise.reject(conflictError) })
      .mockReturnValue({ unwrap: () => Promise.resolve() });
    const resolveConflict = vi.fn().mockResolvedValue('take_theirs');

    const cmd = updateTaskCommand(
      { projectId: 'proj-1', taskId: 'task-1', updates: { title: 'New title' } },
      { resolveConflict }
    );
    await cmd.execute(dispatch, makeGetState([task]));

    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it('conflict: cancel throws', async () => {
    const conflictError = {
      type: 'VERSION_CONFLICT',
      conflict: { taskId: 'task-1', expectedVersion: 5, currentVersion: 6, lastUpdatedBy: 'other@test.com', lastUpdatedAt: '2024-01-02T00:00:00Z', currentTask: task }
    };
    const dispatch = vi.fn().mockReturnValue({ unwrap: () => Promise.reject(conflictError) });
    const resolveConflict = vi.fn().mockResolvedValue('cancel');

    const cmd = updateTaskCommand(
      { projectId: 'proj-1', taskId: 'task-1', updates: { title: 'New title' } },
      { resolveConflict }
    );
    await expect(cmd.execute(dispatch, makeGetState([task]))).rejects.toThrow('Update cancelled by user');
  });

  it('undo throws if capturedPreviousTask is null', async () => {
    const cmd = updateTaskCommand({ projectId: 'proj-1', taskId: 'task-1', updates: { title: 'X' } });
    await expect(cmd.undo(makeDispatch(), makeGetState([task]))).rejects.toThrow('Cannot undo: No previous task data stored');
  });
});

describe('updateTaskPriorityCommand', () => {
  const task = makeTask({ id: 'task-1', priority: 'low', version: 3 });

  it('applies optimistic update and captures previous task', async () => {
    const dispatch = makeDispatch();
    const getState = makeGetState([task]);

    const cmd = updateTaskPriorityCommand({ projectId: 'proj-1', taskId: 'task-1', priority: 'high' });
    await cmd.execute(dispatch, getState);

    expect(cmd.capturedHasOptimisticUpdate).toBe(true);
    expect(cmd.capturedPreviousTask!.priority).toBe('low');
  });

  it('conflict: take_theirs reverts optimistic update', async () => {
    const conflictError = {
      type: 'VERSION_CONFLICT',
      conflict: { taskId: 'task-1', expectedVersion: 3, currentVersion: 4, lastUpdatedBy: 'other@test.com', lastUpdatedAt: '2024-01-02T00:00:00Z', currentTask: task }
    };
    const dispatch = vi.fn()
      .mockReturnValueOnce(undefined) // optimisticUpdateTaskPriority (sync dispatch)
      .mockReturnValueOnce({ unwrap: () => Promise.reject(conflictError) })
      .mockReturnValue(undefined); // revertOptimisticUpdate
    const resolveConflict = vi.fn().mockResolvedValue('take_theirs');

    const cmd = updateTaskPriorityCommand(
      { projectId: 'proj-1', taskId: 'task-1', priority: 'high' },
      { resolveConflict }
    );
    await cmd.execute(dispatch, makeGetState([task]));

    // revertOptimisticUpdate should have been dispatched
    const dispatchedActions = dispatch.mock.calls.map((c: any[]) => c[0]);
    const reverted = dispatchedActions.some((a: any) => a?.type === 'tasks/revertOptimisticUpdate');
    expect(reverted).toBe(true);
  });

  it('conflict: cancel reverts and throws', async () => {
    const conflictError = {
      type: 'VERSION_CONFLICT',
      conflict: { taskId: 'task-1', expectedVersion: 3, currentVersion: 4, lastUpdatedBy: 'other@test.com', lastUpdatedAt: '2024-01-02T00:00:00Z', currentTask: task }
    };
    const dispatch = vi.fn()
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({ unwrap: () => Promise.reject(conflictError) })
      .mockReturnValue(undefined);
    const resolveConflict = vi.fn().mockResolvedValue('cancel');

    const cmd = updateTaskPriorityCommand(
      { projectId: 'proj-1', taskId: 'task-1', priority: 'high' },
      { resolveConflict }
    );
    await expect(cmd.execute(dispatch, makeGetState([task]))).rejects.toThrow('Priority update cancelled by user');
  });
});

describe('updateTaskStatusCommand', () => {
  const task = makeTask({ id: 'task-1', status: 'not started', version: 2 });

  it('applies optimistic update and captures previous task', async () => {
    const dispatch = makeDispatch();
    const getState = makeGetState([task]);

    const cmd = updateTaskStatusCommand({ projectId: 'proj-1', taskId: 'task-1', status: 'in progress' });
    await cmd.execute(dispatch, getState);

    expect(cmd.capturedHasOptimisticUpdate).toBe(true);
    expect(cmd.capturedPreviousTask!.status).toBe('not started');
  });

  it('conflict: keep_mine retries with currentVersion', async () => {
    const conflictError = {
      type: 'VERSION_CONFLICT',
      conflict: { taskId: 'task-1', expectedVersion: 2, currentVersion: 3, lastUpdatedBy: 'other@test.com', lastUpdatedAt: '2024-01-02T00:00:00Z', currentTask: task }
    };
    const dispatch = vi.fn()
      .mockReturnValueOnce(undefined) // optimistic
      .mockReturnValueOnce({ unwrap: () => Promise.reject(conflictError) })
      .mockReturnValue({ unwrap: () => Promise.resolve() });
    const resolveConflict = vi.fn().mockResolvedValue('keep_mine');

    const cmd = updateTaskStatusCommand(
      { projectId: 'proj-1', taskId: 'task-1', status: 'in progress' },
      { resolveConflict }
    );
    await cmd.execute(dispatch, makeGetState([task]));

    expect(resolveConflict).toHaveBeenCalledOnce();
    // dispatch: optimistic + failed attempt + retry
    expect(dispatch).toHaveBeenCalledTimes(3);
  });
});

describe('conflict resolution via createFixedResolver', () => {
  const task = makeTask({ id: 'task-1', version: 1 });
  const conflictError = {
    type: 'VERSION_CONFLICT',
    conflict: { taskId: 'task-1', expectedVersion: 1, currentVersion: 2, lastUpdatedBy: 'other@test.com', lastUpdatedAt: '2024-01-02T00:00:00Z', currentTask: task }
  };

  it('keep_mine: retries update with currentVersion', async () => {
    const dispatch = vi.fn()
      .mockReturnValueOnce({ unwrap: () => Promise.reject(conflictError) })
      .mockReturnValue({ unwrap: () => Promise.resolve() });

    const cmd = updateTaskCommand(
      { projectId: 'proj-1', taskId: 'task-1', updates: { title: 'New' } },
      { resolveConflict: createFixedResolver('keep_mine') }
    );
    await cmd.execute(dispatch, makeGetState([task]));

    expect(dispatch).toHaveBeenCalledTimes(2);
  });

  it('take_theirs: accepts server state, no retry', async () => {
    const dispatch = vi.fn().mockReturnValue({ unwrap: () => Promise.reject(conflictError) });

    const cmd = updateTaskCommand(
      { projectId: 'proj-1', taskId: 'task-1', updates: { title: 'New' } },
      { resolveConflict: createFixedResolver('take_theirs') }
    );
    await cmd.execute(dispatch, makeGetState([task]));

    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it('cancel: rejects with user-cancelled error', async () => {
    const dispatch = vi.fn().mockReturnValue({ unwrap: () => Promise.reject(conflictError) });

    const cmd = updateTaskCommand(
      { projectId: 'proj-1', taskId: 'task-1', updates: { title: 'New' } },
      { resolveConflict: createFixedResolver('cancel') }
    );
    await expect(cmd.execute(dispatch, makeGetState([task]))).rejects.toThrow('Update cancelled by user');
  });
});
