import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useTaskOperations } from './useTaskOperations';
import { createFixedResolver } from '../conflicts';
import tasksReducer from './store/tasksSlice';
import commandsReducer from '../commands/store/commandSlice';
import projectsReducer from '../projects/store/projectsSlice';
import uiReducer from '../ui/store/uiSlice';
import taskService, { TaskServiceError } from './services/taskService';
import { createMockTask } from '../../test/utils/testUtils';
import type { Task } from '../../types';

vi.mock('./services/taskService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./services/taskService')>();
  return {
    ...actual,
    default: {
      createTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
      deleteTasks: vi.fn(),
      bulkUpdateTasks: vi.fn(),
      updateTaskPriority: vi.fn(),
      updateTaskStatus: vi.fn(),
      reorderTasks: vi.fn(),
      reorderTasksByStatus: vi.fn(),
    },
  };
});

const makeStore = (tasks: Task[] = []) =>
  configureStore({
    reducer: {
      tasks: tasksReducer,
      commands: commandsReducer,
      projects: projectsReducer,
      ui: uiReducer,
    },
    preloadedState: {
      tasks: { items: tasks, isLoading: false, error: null, urgentTasks: [], isLoadingUrgentTasks: false, urgentTasksError: null },
    } as any,
  });

const wrap = (store: ReturnType<typeof makeStore>) =>
  ({ children }: { children: React.ReactNode }) =>
    React.createElement(Provider, { store }, children);

beforeEach(() => vi.clearAllMocks());

describe('useTaskOperations facade', () => {
  describe('create', () => {
    it('returns ok:true and dispatches create on success', async () => {
      const created = createMockTask({ id: 'new-1' });
      vi.mocked(taskService.createTask).mockResolvedValue(created);

      const store = makeStore();
      const { result } = renderHook(() => useTaskOperations(), { wrapper: wrap(store) });

      const res = await result.current.create({ projectId: 'proj-1', title: 'New task' });

      expect(res).toEqual({ ok: true });
      expect(store.getState().tasks.items).toHaveLength(1);
    });

    it('returns ok:false on service error', async () => {
      vi.mocked(taskService.createTask).mockRejectedValue(new Error('network error'));

      const store = makeStore();
      const { result } = renderHook(() => useTaskOperations(), { wrapper: wrap(store) });

      const res = await result.current.create({ projectId: 'proj-1', title: 'New task' });

      expect(res.ok).toBe(false);
    });
  });

  describe('update routing', () => {
    it('routes to priority command when only priority is set', async () => {
      const task = createMockTask({ id: 'task-1', priority: 'low', version: 1 });
      vi.mocked(taskService.updateTaskPriority).mockResolvedValue({ ...task, priority: 'high' });

      const store = makeStore([task]);
      const { result } = renderHook(() => useTaskOperations(), { wrapper: wrap(store) });

      const res = await result.current.update({ projectId: 'proj-1', taskId: 'task-1', priority: 'high', destinationIndex: 0 });

      expect(res).toEqual({ ok: true });
      expect(taskService.updateTaskPriority).toHaveBeenCalledOnce();
      expect(taskService.updateTask).not.toHaveBeenCalled();
    });

    it('routes to status command when only status is set', async () => {
      const task = createMockTask({ id: 'task-1', status: 'not started', version: 1 });
      vi.mocked(taskService.updateTaskStatus).mockResolvedValue({ ...task, status: 'in progress' });

      const store = makeStore([task]);
      const { result } = renderHook(() => useTaskOperations(), { wrapper: wrap(store) });

      const res = await result.current.update({ projectId: 'proj-1', taskId: 'task-1', status: 'in progress' });

      expect(res).toEqual({ ok: true });
      expect(taskService.updateTaskStatus).toHaveBeenCalledOnce();
      expect(taskService.updateTask).not.toHaveBeenCalled();
    });

    it('routes to general update when title is set alongside priority', async () => {
      const task = createMockTask({ id: 'task-1', version: 1 });
      vi.mocked(taskService.updateTask).mockResolvedValue(task);

      const store = makeStore([task]);
      const { result } = renderHook(() => useTaskOperations(), { wrapper: wrap(store) });

      const res = await result.current.update({ projectId: 'proj-1', taskId: 'task-1', title: 'New title', priority: 'high' });

      expect(res).toEqual({ ok: true });
      expect(taskService.updateTask).toHaveBeenCalledOnce();
    });

    it('forwards conflictResolver dep to update command', async () => {
      const task = createMockTask({ id: 'task-1', version: 1 });
      const conflictData = { taskId: 'task-1', expectedVersion: 1, currentVersion: 2, lastUpdatedBy: 'other@test.com', lastUpdatedAt: '2024-01-02T00:00:00Z', currentTask: task };
      const conflictError = new TaskServiceError('VERSION_CONFLICT', 'Conflict', conflictData as any);
      vi.mocked(taskService.updateTask)
        .mockRejectedValueOnce(conflictError)
        .mockResolvedValue(task);

      const resolveConflict = createFixedResolver('keep_mine');
      const store = makeStore([task]);
      const { result } = renderHook(() => useTaskOperations({ resolveConflict }), { wrapper: wrap(store) });

      const res = await result.current.update({ projectId: 'proj-1', taskId: 'task-1', title: 'New title' });

      expect(res).toEqual({ ok: true });
      expect(taskService.updateTask).toHaveBeenCalledTimes(2);
    });
  });

  describe('delete', () => {
    it('returns ok:true on success', async () => {
      const task = createMockTask({ id: 'task-1' });
      vi.mocked(taskService.deleteTask).mockResolvedValue(undefined);

      const store = makeStore([task]);
      const { result } = renderHook(() => useTaskOperations(), { wrapper: wrap(store) });

      const res = await result.current.delete({ projectId: 'proj-1', taskId: 'task-1' });

      expect(res).toEqual({ ok: true });
    });
  });

  describe('bulkDelete', () => {
    it('returns ok:true on success', async () => {
      const tasks = [createMockTask({ id: 'task-1' }), createMockTask({ id: 'task-2' })];
      vi.mocked(taskService.deleteTasks).mockResolvedValue(undefined);

      const store = makeStore(tasks);
      const { result } = renderHook(() => useTaskOperations(), { wrapper: wrap(store) });

      const res = await result.current.bulkDelete({ projectId: 'proj-1', taskIds: ['task-1', 'task-2'] });

      expect(res).toEqual({ ok: true });
    });
  });

  describe('bulkUpdate', () => {
    it('returns ok:true on success', async () => {
      const tasks = [createMockTask({ id: 'task-1' }), createMockTask({ id: 'task-2' })];
      vi.mocked(taskService.bulkUpdateTasks).mockResolvedValue(tasks);

      const store = makeStore(tasks);
      const { result } = renderHook(() => useTaskOperations(), { wrapper: wrap(store) });

      const res = await result.current.bulkUpdate({ projectId: 'proj-1', taskIds: ['task-1', 'task-2'], updates: { status: 'completed' } });

      expect(res).toEqual({ ok: true });
    });
  });

  describe('reorder', () => {
    it('reorder by priority returns ok:true', async () => {
      const tasks = [
        createMockTask({ id: 'task-1', priority: 'low', position: 0 }),
        createMockTask({ id: 'task-2', priority: 'low', position: 1 }),
      ];
      vi.mocked(taskService.reorderTasks).mockResolvedValue(tasks);

      const store = makeStore(tasks);
      const { result } = renderHook(() => useTaskOperations(), { wrapper: wrap(store) });

      const res = await result.current.reorder({ by: 'priority', projectId: 'proj-1', priority: 'low', taskIds: ['task-2', 'task-1'] });

      expect(res).toEqual({ ok: true });
      expect(taskService.reorderTasks).toHaveBeenCalledOnce();
    });

    it('reorder by status returns ok:true', async () => {
      const tasks = [
        createMockTask({ id: 'task-1', status: 'not started', statusPosition: 0 }),
        createMockTask({ id: 'task-2', status: 'not started', statusPosition: 1 }),
      ];
      vi.mocked(taskService.reorderTasksByStatus).mockResolvedValue(tasks);

      const store = makeStore(tasks);
      const { result } = renderHook(() => useTaskOperations(), { wrapper: wrap(store) });

      const res = await result.current.reorder({ by: 'status', projectId: 'proj-1', status: 'not started', taskIds: ['task-2', 'task-1'] });

      expect(res).toEqual({ ok: true });
      expect(taskService.reorderTasksByStatus).toHaveBeenCalledOnce();
    });
  });
});
