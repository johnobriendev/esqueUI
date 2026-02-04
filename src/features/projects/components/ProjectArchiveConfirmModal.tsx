// src/components/modals/ProjectArchiveConfirmModal.tsx
import React, { useState } from 'react';
import { Project } from '../../../types';
import Modal from '../../../shared/components/ui/Modal';

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

  const handleConfirm = async () => {
    if (!project) return;

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

  if (!project) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" disabled={isProcessing}>
      <h2 className="text-xl font-semibold text-blue-50 mb-4">{title}</h2>

      <p className="text-slate-300 mb-4">{message}</p>
      <div className="bg-slate-900 rounded-lg p-3 border border-slate-700">
        <p className="text-sm font-semibold text-blue-50">{project.name}</p>
        {project.description && (
          <p className="text-sm text-slate-400 mt-1">{project.description}</p>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="px-4 py-2 text-sm text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={isProcessing}
          className={`px-4 py-2 text-sm text-white rounded-lg transition-colors disabled:opacity-50 ${
            confirmColor === 'yellow'
              ? 'bg-yellow-500 hover:bg-yellow-600'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isProcessing ? 'Processing...' : confirmText}
        </button>
      </div>
    </Modal>
  );
};

export default ProjectArchiveConfirmModal;
