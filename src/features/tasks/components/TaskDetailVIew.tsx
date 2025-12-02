import React from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { openDeleteConfirm, openTaskModal } from '../../ui/store/uiSlice';
import { selectCurrentProject } from '../../../features/projects/store/projectsSlice';
import { Task, TaskStatus, TaskPriority } from '../../../types';
import { WriteGuard } from '../../../components/common/PermissionGuard';
import { getProjectPermissions } from '../../../lib/permissions';
import CommentsSection from '../../comments/components/CommentsSection';

interface TaskDetailViewProps {
  task: Task;
  onClose: () => void;
}

const TaskDetailView: React.FC<TaskDetailViewProps> = ({ task, onClose }) => {
  const dispatch = useAppDispatch();
  const currentProject = useAppSelector(selectCurrentProject);

  const permissions = getProjectPermissions(currentProject);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Handle edit task
  const handleEdit = () => {
    dispatch(openTaskModal(task.id));
    onClose(); // Close the detail view
  };

  // Handle delete task
  const handleDelete = () => {
    dispatch(openDeleteConfirm(task.id));
    onClose(); // Close the detail view when opening delete confirmation
  };

  // Get status badge class
  const getStatusBadgeClass = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500 text-emerald-950';
      case 'in progress':
        return 'bg-blue-500 text-blue-950';
      default:
        return 'bg-slate-600 text-slate-200';
    }
  };

  // Get priority badge class
  const getPriorityBadgeClass = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500 text-red-950';
      case 'high':
        return 'bg-orange-500 text-orange-950';
      case 'medium':
        return 'bg-yellow-500 text-yellow-950';
      case 'low':
        return 'bg-emerald-500 text-emerald-950';
      default:
        return 'bg-slate-600 text-slate-200';
    }
  };

  // Verify the task belongs to the current project
  const isTaskInCurrentProject = currentProject && task.projectId === currentProject.id;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => {
        // Only close if the click is on the backdrop, not on the modal itself
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-blue-50">Task Details</h2>
            {/* 🆕 NEW: Show user's permission level */}
            {currentProject && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                permissions.userRole === 'owner' ? 'bg-indigo-500 text-indigo-950' :
                permissions.userRole === 'editor' ? 'bg-blue-500 text-blue-950' :
                'bg-slate-600 text-slate-200'
              }`}>
                {permissions.userRole}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-300"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        

        {!isTaskInCurrentProject && (
          <div className="bg-yellow-900/50 px-6 py-2 border-b border-yellow-700">
            <p className="text-yellow-200 text-sm">
              This task belongs to a different project than the one you're currently viewing.
            </p>
          </div>
        )}


        {!permissions.canWrite && (
          <div className="bg-blue-900/50 px-6 py-2 border-b border-blue-700">
            <p className="text-blue-200 text-sm">
              You have read-only access to this task.
            </p>
          </div>
        )}
        
        {/* Content */}
        <div className="px-6 py-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-blue-50 mb-2">{task.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(task.status)}`}>
                {task.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityBadgeClass(task.priority)}`}>
                {task.priority}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-300 mb-4">
              <div>
                <span className="font-medium">Created:</span> {formatDate(task.createdAt)}
              </div>
              <div>
                <span className="font-medium">Updated:</span> {formatDate(task.updatedAt)}
              </div>
              {task.updatedBy && (
                <div className="sm:col-span-2">
                  <span className="font-medium">Last edited by:</span> {task.updatedBy}
                </div>
              )}
              {/* <div className="sm:col-span-2">
                <span className="font-medium">Project ID:</span> {task.projectId}
              </div> */}
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-blue-50 mb-2">Description</h3>
              <div className="bg-slate-900 rounded-md p-4 whitespace-pre-wrap text-slate-300">{task.description}</div>
            </div>
          )}

          {/* Custom Fields */}
          {Object.keys(task.customFields).length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-blue-50 mb-2">Custom Fields</h3>
              <div className="bg-slate-900 rounded-md p-4">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  {Object.entries(task.customFields).map(([key, value]) => (
                    <div key={key} className="col-span-1">
                      <dt className="font-medium text-slate-400">{key}</dt>
                      <dd className="text-slate-300 mt-1">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}

          {/* Comments Section */}
          {isTaskInCurrentProject && currentProject && (
            <CommentsSection
              projectId={currentProject.id}
              taskId={task.id}
              permissions={permissions}
            />
          )}
        </div>
        

        <WriteGuard
          fallback={
            <div className="px-6 py-4 border-t border-slate-700 bg-slate-900 flex justify-end">
              <span className="text-sm text-slate-400 italic">Read-only access</span>
            </div>
          }
          showFallback={true}
        >
          <div className="px-6 py-4 border-t border-slate-700 bg-slate-900 flex justify-end space-x-3">
            <button
              onClick={handleDelete}
              className="px-4 py-2 border border-red-700 text-red-400 rounded-md hover:bg-red-900/50 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Edit
            </button>
          </div>
        </WriteGuard>
      </div>
    </div>
  );
};

export default TaskDetailView;