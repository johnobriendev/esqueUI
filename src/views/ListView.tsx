// src/views/ListView.tsx
import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { openTaskModal, setSortConfig, openTaskDetail, openDeleteConfirm, openBulkEdit, selectIsDeleteConfirmOpen } from '../features/ui/store/uiSlice';
import { selectCurrentProject } from '../features/projects/store/projectsSlice';
import { selectSortedFilteredTasks } from '../features/tasks/store/tasksSlice';
import { Task, SortField, SortDirection, TaskStatus, TaskPriority } from '../types';
import { WriteGuard } from '../components/common/PermissionGuard';
import { getProjectPermissions } from '../lib/permissions';

const ListView: React.FC = () => {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector(selectSortedFilteredTasks);
  const filterConfig = useAppSelector(state => state.ui.filterConfig);
  const sortConfig = useAppSelector(state => state.ui.sortConfig);
  const isDeleteConfirmOpen = useAppSelector(selectIsDeleteConfirmOpen);
  const currentProject = useAppSelector(selectCurrentProject);
  const permissions = getProjectPermissions(currentProject);

  // State for selected tasks (for bulk actions)
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 10;

  const [permissionError, setPermissionError] = useState<string | null>(null);


  // Reset selections when tasks change (due to deletion, etc.)
  useEffect(() => {
    // Create a set of existing task IDs
    const taskIdsSet = new Set(tasks.map(task => task.id));

    // Keep only the selections that still exist in tasks
    const updatedSelections = new Set<string>();
    selectedTaskIds.forEach(id => {
      if (taskIdsSet.has(id)) {
        updatedSelections.add(id);
      }
    });

    setSelectedTaskIds(updatedSelections);
  }, [tasks]);

  // Clear selected tasks when delete confirm modal closes
  useEffect(() => {
    if (!isDeleteConfirmOpen) {
      // setSelectedTaskIds(new Set());
    }
  }, [isDeleteConfirmOpen]);

  // Clear permission errors after 5 seconds
  useEffect(() => {
    if (permissionError) {
      const timer = setTimeout(() => {
        setPermissionError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [permissionError]);


  // Filter and sort tasks based on current configuration and current project
  const filteredAndSortedTasks = tasks;

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [tasks]);

  // Get paginated tasks
  const paginatedTasks = React.useMemo(() => {
    const startIndex = (currentPage - 1) * tasksPerPage;
    return filteredAndSortedTasks.slice(startIndex, startIndex + tasksPerPage);
  }, [filteredAndSortedTasks, currentPage, tasksPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredAndSortedTasks.length / tasksPerPage);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortConfig.field === field) {
      // Toggle direction if same field
      const newDirection: SortDirection = sortConfig.direction === 'asc' ? 'desc' : 'asc';
      dispatch(setSortConfig({ field, direction: newDirection }));
    } else {
      // Set new field with default descending
      dispatch(setSortConfig({ field, direction: 'desc' }));
    }
  };

  // Get sort direction indicator
  const getSortIndicator = (field: SortField) => {
    if (sortConfig.field !== field) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Handle edit task with permission check
  const handleEditTask = (task: Task) => {
    // 🆕 NEW: Check permissions before allowing edit
    if (!permissions.canWrite) {
      setPermissionError('You don\'t have permission to edit tasks in this project.');
      return;
    }
    dispatch(openTaskModal(task.id));
  };

  // Handle delete task with permission check
  const handleDeleteTask = (id: string) => {
    // 🆕 NEW: Check permissions before allowing delete
    if (!permissions.canWrite) {
      setPermissionError('You don\'t have permission to delete tasks in this project.');
      return;
    }
    dispatch(openDeleteConfirm(id));
  };

  // Handle bulk delete with permission check
  const handleBulkDelete = () => {
    // 🆕 NEW: Check permissions before allowing bulk delete
    if (!permissions.canWrite) {
      setPermissionError('You don\'t have permission to delete tasks in this project.');
      return;
    }
    if (selectedTaskIds.size === 0) return;
    dispatch(openDeleteConfirm(Array.from(selectedTaskIds)));
  };

  // Handle bulk edit with permission check
  const handleBulkEdit = (type: 'status' | 'priority') => {
    if (!permissions.canWrite) {
      setPermissionError('You don\'t have permission to edit tasks in this project.');
      return;
    }
    if (selectedTaskIds.size === 0) return;
    dispatch(openBulkEdit({
      type,
      taskIds: Array.from(selectedTaskIds)
    }));
  };

  // Toggle task selection (only for users with write permissions)
  const toggleTaskSelection = (id: string) => {
    // 🆕 NEW: Check permissions before allowing selection
    if (!permissions.canWrite) {
      setPermissionError('You don\'t have permission to select tasks for bulk operations.');
      return;
    }
    const newSelection = new Set(selectedTaskIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedTaskIds(newSelection);
  };

  // Toggle all selection (only for users with write permissions)
  const toggleSelectAll = () => {
    // 🆕 NEW: Check permissions before allowing select all
    if (!permissions.canWrite) {
      setPermissionError('You don\'t have permission to select tasks for bulk operations.');
      return;
    }
    if (selectedTaskIds.size === paginatedTasks.length) {
      // Deselect all
      setSelectedTaskIds(new Set());
    } else {
      // Select all
      const newSelection = new Set<string>();
      paginatedTasks.forEach(task => newSelection.add(task.id));
      setSelectedTaskIds(newSelection);
    }
  };

  // Style classes for status badges
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

  // Style classes for priority badges
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
    }
  };

  // Pagination navigation
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Show a message if no project is selected
  if (!currentProject) {
    return (
      <div className="bg-slate-800 shadow rounded-lg p-8 text-center">
        <h2 className="text-xl font-semibold text-blue-50 mb-4">No Project Selected</h2>
        <p className="text-slate-300">Please select a project from the dashboard to view its tasks.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 shadow rounded-lg overflow-hidden">
      {/* 🆕 NEW: Permission Error Banner */}
      {permissionError && (
        <div className="bg-red-900/50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-200">{permissionError}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setPermissionError(null)}
                className="text-red-400 hover:text-red-300"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 NEW: User Role Indicator */}
      <div className="bg-slate-900 px-4 py-2 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">
            Your role: <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              permissions.userRole === 'owner' ? 'bg-indigo-500 text-indigo-950' :
              permissions.userRole === 'editor' ? 'bg-blue-500 text-blue-950' :
              'bg-slate-600 text-slate-200'
            }`}>
              {permissions.userRole}
            </span>
          </span>
          {!permissions.canWrite && (
            <span className="text-xs text-slate-400 italic">
              Read-only access
            </span>
          )}
        </div>
      </div>


      <WriteGuard>
        {selectedTaskIds.size > 0 && (
          <div className="bg-blue-900/30 px-4 py-2 flex items-center justify-between border-b border-slate-700">
            <span className="text-sm text-blue-50 font-medium">
              {selectedTaskIds.size} {selectedTaskIds.size === 1 ? 'task' : 'tasks'} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkEdit('status')}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
              >
                Change Status
              </button>
              <button
                onClick={() => handleBulkEdit('priority')}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
              >
                Change Priority
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}
      </WriteGuard>

      {/* Task table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-900">
            <tr>

              <WriteGuard>
                <th className="px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={paginatedTasks.length > 0 && selectedTaskIds.size === paginatedTasks.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-600 text-blue-500 focus:ring-blue-500 bg-slate-800"
                  />
                </th>
              </WriteGuard>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-slate-400 hover:text-blue-50 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('title')}
              >
                Title {getSortIndicator('title')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-slate-400 hover:text-blue-50 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('status')}
              >
                Status {getSortIndicator('status')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-slate-400 hover:text-blue-50 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('priority')}
              >
                Priority {getSortIndicator('priority')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-slate-400 hover:text-blue-50 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('updatedAt')}
              >
                Updated {getSortIndicator('updatedAt')}
              </th>

              <WriteGuard>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </WriteGuard>
            </tr>
          </thead>
          <tbody className="bg-slate-800 divide-y divide-slate-700">
            {paginatedTasks.map(task => (
              <tr key={task.id} className="hover:bg-slate-700">

                <WriteGuard>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.has(task.id)}
                      onChange={() => toggleTaskSelection(task.id)}
                      className="rounded border-slate-600 text-blue-500 focus:ring-blue-500 bg-slate-700"
                    />
                  </td>
                </WriteGuard>
                <td className="px-6 py-4">
                  <div
                    className="text-sm font-medium text-blue-50 cursor-pointer hover:text-blue-400"
                    onClick={() => dispatch(openTaskDetail(task.id))}
                  >
                    {task.title}
                  </div>
                  {task.description && (
                    <div className="text-sm text-slate-300 truncate max-w-xs">{task.description}</div>
                  )}
                  {/* Show custom fields if any */}
                  {Object.keys(task.customFields).length > 0 && (
                    <div className="mt-1 text-xs text-slate-400">
                      {Object.entries(task.customFields).slice(0, 2).map(([key, value], index) => (
                        <span key={key} className="mr-2">
                          <span className="font-medium">{key}:</span> {String(value)}
                          {index < Math.min(2, Object.keys(task.customFields).length - 1) && ", "}
                        </span>
                      ))}
                      {Object.keys(task.customFields).length > 2 && (
                        <span className="text-slate-500">+{Object.keys(task.customFields).length - 2} more</span>
                      )}
                    </div>
                  )}
                  
                  {/* {task.updatedBy && (
                    <div className="mt-1 text-xs text-gray-400">
                      Last edited by: {task.updatedBy}
                    </div>
                  )} */}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(task.status)}`}>
                    {task.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeClass(task.priority)}`}>
                    {task.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                  {formatDate(task.updatedAt)}
                </td>
                {/* 🔄 MODIFIED: Only show actions for users with write permissions */}
                <WriteGuard>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditTask(task)}
                      className="text-blue-400 hover:text-blue-300 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </WriteGuard>
              </tr>
            ))}

            {paginatedTasks.length === 0 && (
              <tr>
                {/* 🔄 MODIFIED: Adjust colspan based on user permissions */}
                <td colSpan={permissions.canWrite ? 6 : 4} className="px-6 py-10 text-center text-slate-400">
                  No tasks found. {permissions.canWrite ? 'Create a new task to get started.' : 'No tasks to display.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 flex items-center justify-between border-t border-slate-700 sm:px-6 bg-slate-900">
          <div className="flex-1 flex justify-between sm:hidden">
            {/* Mobile pagination */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md ${currentPage === 1
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
            >
              Previous
            </button>
            <span className="text-sm text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md ${currentPage === totalPages
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
            >
              Next
            </button>
          </div>

          {/* Desktop pagination */}
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-300">
                Showing <span className="font-medium">{(currentPage - 1) * tasksPerPage + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * tasksPerPage, filteredAndSortedTasks.length)}
                </span>{' '}
                of <span className="font-medium">{filteredAndSortedTasks.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-600 text-sm font-medium ${currentPage === 1
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                >
                  First
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 border border-slate-600 text-sm font-medium ${currentPage === 1
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                >
                  Prev
                </button>

                {/* Page numbers - show current page and adjacent pages */}
                {Array.from(
                  { length: Math.min(5, totalPages) },
                  (_, i) => {
                    // Center around current page
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum
                            ? 'z-10 bg-blue-500 border-blue-500 text-white'
                            : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 border border-slate-600 text-sm font-medium ${currentPage === totalPages
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                >
                  Next
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-600 text-sm font-medium ${currentPage === totalPages
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                >
                  Last
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListView;