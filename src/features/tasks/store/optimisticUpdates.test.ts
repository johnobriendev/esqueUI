import { describe, it, expect, vi } from 'vitest';
import {
  applyPriorityChange,
  applyStatusChange,
  applyReorder,
  applyReorderByStatus,
  revertSingleTask,
  revertMultipleTasks,
  withOptimisticUpdate
} from './optimisticUpdates';
import { createMockTask } from '../../../test/utils/testUtils';

describe('optimisticUpdates', () => {
  describe('applyPriorityChange', () => {
    it('updates priority and position', () => {
      const items = [createMockTask({ id: 'task-1', priority: 'low', position: 0 })];
      applyPriorityChange(items, 'task-1', 'high', 3);
      expect(items[0].priority).toBe('high');
      expect(items[0].position).toBe(3);
    });

    it('preserves position when destinationIndex omitted', () => {
      const items = [createMockTask({ id: 'task-1', priority: 'low', position: 5 })];
      applyPriorityChange(items, 'task-1', 'medium');
      expect(items[0].position).toBe(5);
    });

    it('is a no-op for unknown taskId', () => {
      const items = [createMockTask({ id: 'task-1' })];
      applyPriorityChange(items, 'unknown', 'urgent');
      expect(items[0].priority).toBe('medium');
    });
  });

  describe('applyStatusChange', () => {
    it('updates status and position', () => {
      const items = [createMockTask({ id: 'task-1', status: 'not started', position: 0 })];
      applyStatusChange(items, 'task-1', 'completed', 2);
      expect(items[0].status).toBe('completed');
      expect(items[0].position).toBe(2);
    });

    it('preserves position when destinationIndex omitted', () => {
      const items = [createMockTask({ id: 'task-1', status: 'not started', position: 4 })];
      applyStatusChange(items, 'task-1', 'in progress');
      expect(items[0].position).toBe(4);
    });
  });

  describe('applyReorder', () => {
    it('assigns new positions based on taskIds order', () => {
      const items = [
        createMockTask({ id: 'a', position: 0 }),
        createMockTask({ id: 'b', position: 1 }),
        createMockTask({ id: 'c', position: 2 }),
      ];
      applyReorder(items, ['c', 'a', 'b']);
      expect(items.find(t => t.id === 'c')!.position).toBe(0);
      expect(items.find(t => t.id === 'a')!.position).toBe(1);
      expect(items.find(t => t.id === 'b')!.position).toBe(2);
    });
  });

  describe('applyReorderByStatus', () => {
    it('assigns new statusPositions based on taskIds order', () => {
      const items = [
        createMockTask({ id: 'a', statusPosition: 0 }),
        createMockTask({ id: 'b', statusPosition: 1 }),
      ];
      applyReorderByStatus(items, ['b', 'a']);
      expect(items.find(t => t.id === 'b')!.statusPosition).toBe(0);
      expect(items.find(t => t.id === 'a')!.statusPosition).toBe(1);
    });
  });

  describe('revertSingleTask', () => {
    it('restores original task', () => {
      const original = createMockTask({ id: 'task-1', priority: 'low' });
      const items = [{ ...original, priority: 'urgent' as const }];
      revertSingleTask(items, 'task-1', original);
      expect(items[0].priority).toBe('low');
    });
  });

  describe('revertMultipleTasks', () => {
    it('restores all original tasks', () => {
      const originals = [
        createMockTask({ id: 'a', position: 0 }),
        createMockTask({ id: 'b', position: 1 }),
      ];
      const items = [{ ...originals[0], position: 9 }, { ...originals[1], position: 9 }];
      revertMultipleTasks(items, originals);
      expect(items[0].position).toBe(0);
      expect(items[1].position).toBe(1);
    });
  });

  describe('withOptimisticUpdate', () => {
    it('calls apply then apiCall', async () => {
      const apply = vi.fn();
      const apiCall = vi.fn().mockResolvedValue('ok');
      const revert = vi.fn();
      await withOptimisticUpdate(apply, apiCall, revert);
      expect(apply).toHaveBeenCalledOnce();
      expect(apiCall).toHaveBeenCalledOnce();
      expect(revert).not.toHaveBeenCalled();
    });

    it('calls revert and rethrows on apiCall failure', async () => {
      const apply = vi.fn();
      const apiCall = vi.fn().mockRejectedValue(new Error('network'));
      const revert = vi.fn();
      await expect(withOptimisticUpdate(apply, apiCall, revert)).rejects.toThrow('network');
      expect(revert).toHaveBeenCalledOnce();
    });
  });
});
