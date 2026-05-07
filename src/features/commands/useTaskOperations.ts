import { useAppDispatch } from '../../app/hooks';
import { executeCommand } from './store/commandSlice';
import {
  createTaskCommand,
  updateTaskCommand,
  deleteTaskCommand,
  bulkDeleteTasksCommand,
  bulkUpdateTasksCommand,
  updateTaskPriorityCommand,
  updateTaskStatusCommand,
  reorderTasksCommand,
  reorderTasksByStatusCommand,
  CreateTaskData,
  UpdateTaskData,
  DeleteTaskData,
  BulkDeleteTasksData,
  BulkUpdateTasksData,
  UpdateTaskPriorityData,
  UpdateTaskStatusData,
  ReorderTasksData,
  ReorderTasksByStatusData,
} from './commands/taskCommands';

export function useTaskOperations() {
  const dispatch = useAppDispatch();

  return {
    createTask: (data: CreateTaskData) =>
      dispatch(executeCommand(createTaskCommand(data))).unwrap(),
    updateTask: (data: UpdateTaskData) =>
      dispatch(executeCommand(updateTaskCommand(data))).unwrap(),
    deleteTask: (data: DeleteTaskData) =>
      dispatch(executeCommand(deleteTaskCommand(data))).unwrap(),
    bulkDeleteTasks: (data: BulkDeleteTasksData) =>
      dispatch(executeCommand(bulkDeleteTasksCommand(data))).unwrap(),
    bulkUpdateTasks: (data: BulkUpdateTasksData) =>
      dispatch(executeCommand(bulkUpdateTasksCommand(data))).unwrap(),
    updateTaskPriority: (data: UpdateTaskPriorityData) =>
      dispatch(executeCommand(updateTaskPriorityCommand(data))).unwrap(),
    updateTaskStatus: (data: UpdateTaskStatusData) =>
      dispatch(executeCommand(updateTaskStatusCommand(data))).unwrap(),
    reorderTasks: (data: ReorderTasksData) =>
      dispatch(executeCommand(reorderTasksCommand(data))).unwrap(),
    reorderTasksByStatus: (data: ReorderTasksByStatusData) =>
      dispatch(executeCommand(reorderTasksByStatusCommand(data))).unwrap(),
  };
}
