// src/features/projects/components/ArchivedProjectsModal.tsx
import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  fetchArchivedProjects,
  unarchiveProject,
  unhideProject,
  selectArchivedProjects,
  selectArchivedLoading,
} from '../store/projectsSlice';
import { selectIsArchivedProjectsModalOpen, closeArchivedProjectsModal } from '../../ui/store/uiSlice';
import { getProjectPermissions } from '../../../shared/lib/permissions';
import { Project } from '../../../types';
import ProjectArchiveConfirmModal from './ProjectArchiveConfirmModal';
import Modal from '../../../shared/components/ui/Modal';

const ArchivedProjectsModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectIsArchivedProjectsModalOpen);
  const archivedProjects = useAppSelector(selectArchivedProjects);
  const isLoading = useAppSelector(selectArchivedLoading);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [projectToRestore, setProjectToRestore] = useState<Project | null>(null);

  // Fetch archived projects when modal opens
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchArchivedProjects());
    }
  }, [isOpen, dispatch]);

  const handleClose = () => {
    dispatch(closeArchivedProjectsModal());
  };

  const handleRestore = (project: Project) => {
    setProjectToRestore(project);
    setShowConfirmModal(true);
  };

  const confirmRestore = async (project: Project) => {
    const permissions = getProjectPermissions(project);

    if (permissions.isOwner) {
      // Owner: unarchive (restores for all)
      await dispatch(unarchiveProject(project.id)).unwrap();
    } else {
      // Collaborator: unhide (shows for self only)
      await dispatch(unhideProject(project.id)).unwrap();
    }
  };

  const handleCloseConfirmModal = () => {
    setShowConfirmModal(false);
    setProjectToRestore(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl" containerClassName="dash-surface border dash-border">
      {/* Header */}
      <div className="-mx-6 -mt-6 px-6 py-4 border-b dash-border flex items-center justify-between">
        <h2 className="text-xl font-semibold dash-text">Archived Projects</h2>
        <button
          onClick={handleClose}
          className="dash-text-muted transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="py-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="h-8 w-8 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin"></div>
            </div>
          ) : archivedProjects.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto dash-text-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <p className="dash-text-muted">No archived projects</p>
            </div>
          ) : (
            <div className="space-y-4">
              {archivedProjects.map((project) => {
                const permissions = getProjectPermissions(project);

                return (
                  <div
                    key={project.id}
                    className="p-4 border dash-border rounded-lg transition-colors dash-bg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold dash-text">{project.name}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            permissions.userRole === 'owner' ? 'bg-red-500 text-gray-950' :
                            permissions.userRole === 'editor' ? 'bg-blue-500 text-gray-950' :
                            'bg-slate-500 text-gray-950'
                          }`}>
                            {permissions.userRole}
                          </span>
                        </div>
                        {project.description && (
                          <p className="text-sm dash-text-muted mb-2">{project.description}</p>
                        )}
                        <p className="text-xs dash-text-muted">
                          Archived: {new Date(project.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRestore(project)}
                        className="ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors dash-accent"
                      >
                        {permissions.isOwner ? 'Unarchive' : 'Unhide'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>

      {/* Footer */}
      <div className="-mx-6 -mb-6 px-6 py-4 border-t dash-border flex justify-end">
        <button
          onClick={handleClose}
          className="px-4 py-2 text-sm dash-text-muted transition-colors"
        >
          Close
        </button>
      </div>

      {/* Unarchive Confirmation Modal */}
      {projectToRestore && (
        <ProjectArchiveConfirmModal
          isOpen={showConfirmModal}
          project={projectToRestore}
          action="unarchive"
          onClose={handleCloseConfirmModal}
          onConfirm={confirmRestore}
        />
      )}
    </Modal>
  );
};

export default ArchivedProjectsModal;
