// src/components/modals/ProjectArchiveConfirmModal.tsx
import React, { useState } from 'react';
import { Project } from '../../types';

interface ProjectArchiveConfirmModalProps {
  isOpen: boolean;
  project: Project | null;
  action: 'archive' | 'unarchive';
  onClose: () => void;
  onConfirm: (project: Project) => Promise<void>;
}

const ProjectArchiveConfirmModal: React.FC<ProjectArchiveConfirmModalProps> = ({
  isOpen,
  project,
  action,
  onClose,
  onConfirm,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !project) return null;

  const handleConfirm = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      await onConfirm(project);
      onClose();
    } catch (err: any) {
      setError(err.message || `Failed to ${action} project`);
    } finally {
      setIsProcessing(false);
    }
  };

  const isArchiving = action === 'archive';
  const title = isArchiving ? 'Archive Project' : 'Unarchive Project';
  const message = isArchiving
    ? 'Are you sure you want to archive this project? It will be hidden from your dashboard but can be restored later.'
    : 'Are you sure you want to unarchive this project? It will be restored to your dashboard.';
  const confirmText = isArchiving ? 'Archive' : 'Unarchive';
  const confirmColor = isArchiving ? 'yellow' : 'blue';

  return (
    <div
      className="fixed inset-0 bg-black/10 backdrop-blur-xs flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && !isProcessing && onClose()}
    >
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-gray-700 mb-4">{message}</p>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-sm font-semibold text-gray-900">{project.name}</p>
            {project.description && (
              <p className="text-sm text-gray-600 mt-1">{project.description}</p>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className={`px-4 py-2 text-sm text-white rounded-lg transition-colors disabled:opacity-50 ${
              confirmColor === 'yellow'
                ? 'bg-yellow-600 hover:bg-yellow-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isProcessing ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectArchiveConfirmModal;
