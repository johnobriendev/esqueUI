import { Task, TaskStatus, TaskPriority } from '../../../types';

export function applyPriorityChange(
  items: Task[],
  taskId: string,
  priority: TaskPriority,
  destinationIndex?: number
): void {
  const idx = items.findIndex(t => t.id === taskId);
  if (idx !== -1) {
    items[idx] = {
      ...items[idx],
      priority,
      position: destinationIndex ?? items[idx].position,
      updatedAt: new Date().toISOString()
    };
  }
}

export function applyStatusChange(
  items: Task[],
  taskId: string,
  status: TaskStatus,
  destinationIndex?: number
): void {
  const idx = items.findIndex(t => t.id === taskId);
  if (idx !== -1) {
    items[idx] = {
      ...items[idx],
      status,
      position: destinationIndex ?? items[idx].position,
      updatedAt: new Date().toISOString()
    };
  }
}

export function applyReorder(items: Task[], taskIds: string[]): void {
  taskIds.forEach((taskId, index) => {
    const idx = items.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      items[idx] = { ...items[idx], position: index, updatedAt: new Date().toISOString() };
    }
  });
}

export function applyReorderByStatus(items: Task[], taskIds: string[]): void {
  taskIds.forEach((taskId, index) => {
    const idx = items.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      items[idx] = { ...items[idx], statusPosition: index, updatedAt: new Date().toISOString() };
    }
  });
}

export function revertSingleTask(items: Task[], taskId: string, originalTask: Task): void {
  const idx = items.findIndex(t => t.id === taskId);
  if (idx !== -1) {
    items[idx] = originalTask;
  }
}

export function revertMultipleTasks(items: Task[], originalTasks: Task[]): void {
  originalTasks.forEach(orig => {
    const idx = items.findIndex(t => t.id === orig.id);
    if (idx !== -1) {
      items[idx] = orig;
    }
  });
}

export async function withOptimisticUpdate<T>(
  apply: () => void,
  apiCall: () => Promise<T>,
  revert: () => void
): Promise<T> {
  apply();
  try {
    return await apiCall();
  } catch (error) {
    revert();
    throw error;
  }
}
