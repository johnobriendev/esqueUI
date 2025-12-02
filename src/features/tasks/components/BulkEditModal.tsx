// src/features/tasks/components/BulkEditModal.tsx
import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import { closeBulkEdit } from '../../ui/store/uiSlice';
import { selectCurrentProject } from '../../../features/projects/store/projectsSlice';
import { executeCommand } from '../../../features/commands/store/commandSlice';
import { bulkUpdateTasksCommand } from '../../commands/commands/taskCommands';
import { TaskStatus, TaskPriority } from '../../../types';

const BulkEditModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(state => state.ui.isBulkEditOpen);
  const editType = useAppSelector(state => state.ui.bulkEditType);
  const selectedTaskIds = useAppSelector(state => state.ui.selectedTaskIds);
  const currentProject = useAppSelector(selectCurrentProject);

  const [status, setStatus] = useState<TaskStatus>('not started');
  const [priority, setPriority] = useState<TaskPriority>('low');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close the modal
  const handleClose = () => {
    dispatch(closeBulkEdit());
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      handleClose();
    }
  };

  // Submit the bulk edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentProject) {
      setError('No project selected');
      return;
    }

    if (selectedTaskIds.length === 0) {
      setError('No tasks selected');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 🎯 UPDATED: Use bulkUpdateTasksCommand instead of direct thunk
      const updates = editType === 'status'
        ? { status }
        : { priority };

      console.log('🎯 Creating BULK UPDATE command for', selectedTaskIds.length, 'tasks');

      const command = bulkUpdateTasksCommand({
        projectId: currentProject.id,
        taskIds: selectedTaskIds,
        updates
      });

      await dispatch(executeCommand(command)).unwrap();
      console.log('✅ Bulk update command executed successfully');

      // Close modal on success
      handleClose();
    } catch (err) {
      console.error('❌ Bulk update command failed:', err);
      setError('Failed to update tasks. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If modal is closed, don't render anything
  if (!isOpen || !editType) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 text-blue-50">
          Bulk Edit: Change {editType === 'status' ? 'Status' : 'Priority'}
        </h2>

        {error && (
          <div className="mb-4 p-2 bg-red-900/50 text-red-200 rounded border border-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {editType === 'status' ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                New Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 bg-slate-900 text-slate-300 border border-slate-700 rounded-md placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="not started">Not Started</option>
                <option value="in progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                New Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 bg-slate-900 text-slate-300 border border-slate-700 rounded-md placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-slate-700 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-md text-white ${isSubmitting ? 'bg-blue-500/60 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                }`}
            >
              {isSubmitting ? 'Updating...' : 'Update Tasks'}
            </button>
          </div>

          <p className="mt-4 text-sm text-slate-400">
            This will update {selectedTaskIds.length} {selectedTaskIds.length === 1 ? 'task' : 'tasks'}.
          </p>
        </form>
      </div>
    </div>
  );
};

export default BulkEditModal;