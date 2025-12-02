// src/components/modals/ProjectFormModal.tsx
import React from 'react';
import { Project } from '../../../types';

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
  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName.trim()) {
      onSubmit();
    }
  };

  // If modal is closed, don't render
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
        <h2 className="text-xl font-semibold mb-6 text-blue-50">
          {isEditing ? 'Edit Project' : 'Create New Project'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label htmlFor="project-name" className="block text-sm font-medium text-slate-300 mb-1">
                Project Name*
              </label>
              <input
                id="project-name"
                type="text"
                value={projectName}
                onChange={(e) => onProjectNameChange(e.target.value)}
                className="w-full px-4 py-3 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-900 text-blue-50"
                placeholder="Enter project name"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="project-description" className="block text-sm font-medium text-slate-300 mb-1">
                Description (optional)
              </label>
              <textarea
                id="project-description"
                value={projectDescription}
                onChange={(e) => onProjectDescriptionChange(e.target.value)}
                className="w-full px-4 py-3 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-900 text-blue-50"
                placeholder="Enter project description"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!projectName.trim()}
                className={`px-5 py-2.5 rounded-lg text-white shadow-sm ${
                  projectName.trim()
                    ? 'bg-blue-500 hover:bg-blue-600 hover:shadow'
                    : 'bg-blue-500/30 cursor-not-allowed'
                }`}
              >
                {isEditing ? 'Update Project' : 'Create Project'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectFormModal;
