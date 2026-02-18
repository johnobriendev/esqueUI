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
    <Modal isOpen={isOpen} onClose={onClose} size="md" disabled={isProcessing} containerClassName="dash-surface border dash-border">
      <h2 className="text-xl font-semibold dash-text mb-4">{title}</h2>

      <p className="dash-text-muted mb-4">{message}</p>
      <div className="dash-bg rounded-lg p-3 border dash-border">
        <p className="text-sm font-semibold dash-text">{project.name}</p>
        {project.description && (
          <p className="text-sm dash-text-muted mt-1">{project.description}</p>
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
          className="px-4 py-2 text-sm border dash-border dash-btn2 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={isProcessing}
          className={`px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 ${
            confirmColor === 'yellow'
              ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
              : 'dash-accent'
          }`}
        >
          {isProcessing ? 'Processing...' : confirmText}
        </button>
      </div>
    </Modal>
  );
};

export default ProjectArchiveConfirmModal;
