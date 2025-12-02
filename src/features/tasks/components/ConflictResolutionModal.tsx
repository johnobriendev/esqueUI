// src/features/tasks/components/ConflictResolutionModal.tsx
import React from 'react';
import { Task, TaskConflict } from '../../../types';

interface ConflictResolutionModalProps {
  isOpen: boolean;
  conflict: TaskConflict | null;
  userChanges: Partial<Task>;
  onResolve: (resolution: 'keep_mine' | 'take_theirs' | 'merge') => void;
  onCancel: () => void;
}

const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  isOpen,
  conflict,
  userChanges,
  onResolve,
  onCancel
}) => {
  if (!isOpen || !conflict) return null;

  const { currentTask, lastUpdatedBy, lastUpdatedAt } = conflict;
  
  // Helper to show what changed
  const getChangedFields = () => {
    const changes: string[] = [];
    if (userChanges.title && userChanges.title !== currentTask.title) {
      changes.push('title');
    }
    if (userChanges.description !== undefined && userChanges.description !== currentTask.description) {
      changes.push('description');
    }
    if (userChanges.status && userChanges.status !== currentTask.status) {
      changes.push('status');
    }
    if (userChanges.priority && userChanges.priority !== currentTask.priority) {
      changes.push('priority');
    }
    return changes;
  };

  const changedFields = getChangedFields();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-900">
          <div className="flex items-center space-x-2">
            <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h2 className="text-xl font-semibold text-blue-50">Conflict Detected</h2>
              <p className="text-sm text-slate-400">
                This task was modified by <strong>{lastUpdatedBy}</strong> while you were editing
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
          <div className="mb-6">
            <p className="text-sm text-slate-300 mb-4">
              You both tried to change: <strong>{changedFields.join(', ')}</strong>
            </p>
            <p className="text-xs text-slate-400">
              Their changes were saved at {new Date(lastUpdatedAt).toLocaleString()}
            </p>
          </div>

          {/* Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Your Changes */}
            <div className="border border-slate-700 rounded-lg bg-slate-900">
              <div className="bg-slate-800 px-4 py-2 border-b border-slate-700">
                <h3 className="font-medium text-blue-50">Your Changes</h3>
              </div>
              <div className="p-4 space-y-3">
                {userChanges.title !== undefined && (
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase">Title</label>
                    <p className="text-sm text-slate-300">{userChanges.title}</p>
                  </div>
                )}
                {userChanges.description !== undefined && (
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase">Description</label>
                    <p className="text-sm text-slate-300">{userChanges.description || '(empty)'}</p>
                  </div>
                )}
                {userChanges.status && (
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase">Status</label>
                    <p className="text-sm capitalize text-slate-300">{userChanges.status}</p>
                  </div>
                )}
                {userChanges.priority && (
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase">Priority</label>
                    <p className="text-sm capitalize text-slate-300">{userChanges.priority}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Their Changes */}
            <div className="border border-slate-700 rounded-lg bg-slate-900">
              <div className="bg-slate-800 px-4 py-2 border-b border-slate-700">
                <h3 className="font-medium text-blue-50">Their Changes ({lastUpdatedBy})</h3>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase">Title</label>
                  <p className="text-sm text-slate-300">{currentTask.title}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase">Description</label>
                  <p className="text-sm text-slate-300">{currentTask.description || '(empty)'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase">Status</label>
                  <p className="text-sm capitalize text-slate-300">{currentTask.status}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase">Priority</label>
                  <p className="text-sm capitalize text-slate-300">{currentTask.priority}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-900 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onResolve('keep_mine')}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Use My Changes
          </button>
          <button
            onClick={() => onResolve('take_theirs')}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            Use Their Changes
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 border border-slate-700 rounded-md hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConflictResolutionModal;