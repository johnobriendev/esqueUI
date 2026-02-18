// src/components/modals/ProjectFormModal.tsx
import React from 'react';
import { Project } from '../../../types';
import Modal from '../../../shared/components/ui/Modal';

interface ProjectFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  editingProject: Project | null;
  projectName: string;
  projectDescription: string;
  onProjectNameChange: (value: string) => void;
  onProjectDescriptionChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  isEditing,
  editingProject,
  projectName,
  projectDescription,
  onProjectNameChange,
  onProjectDescriptionChange,
  onClose,
  onSubmit
}) => {
  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName.trim()) {
      onSubmit();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" containerClassName="dash-surface border dash-border">
      <h2 className="text-xl font-semibold mb-6 dash-text">
        {isEditing ? 'Edit Project' : 'Create New Project'}
      </h2>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label htmlFor="project-name" className="block text-sm font-medium dash-text-muted mb-1">
                Project Name*
              </label>
              <input
                id="project-name"
                type="text"
                value={projectName}
                onChange={(e) => onProjectNameChange(e.target.value)}
                className="w-full px-4 py-3 border dash-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dash-bg dash-text"
                placeholder="Enter project name"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="project-description" className="block text-sm font-medium dash-text-muted mb-1">
                Description (optional)
              </label>
              <textarea
                id="project-description"
                value={projectDescription}
                onChange={(e) => onProjectDescriptionChange(e.target.value)}
                className="w-full px-4 py-3 border dash-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dash-bg dash-text"
                placeholder="Enter project description"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border dash-border rounded-lg dash-btn2 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!projectName.trim()}
                className={`px-5 py-2.5 rounded-lg shadow-sm dash-accent ${
                  projectName.trim()
                    ? 'hover:shadow'
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                {isEditing ? 'Update Project' : 'Create Project'}
              </button>
            </div>
          </div>
        </form>
    </Modal>
  );
};

export default ProjectFormModal;
