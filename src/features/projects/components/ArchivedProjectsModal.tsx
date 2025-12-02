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
import { getProjectPermissions } from '../../../lib/permissions';
import { Project } from '../../../types';
import ProjectArchiveConfirmModal from '../../../components/modals/ProjectArchiveConfirmModal';

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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-blue-50">Archived Projects</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="h-8 w-8 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin"></div>
            </div>
          ) : archivedProjects.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <p className="text-slate-400">No archived projects</p>
            </div>
          ) : (
            <div className="space-y-4">
              {archivedProjects.map((project) => {
                const permissions = getProjectPermissions(project);

                return (
                  <div
                    key={project.id}
                    className="p-4 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors bg-slate-900"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-blue-50">{project.name}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            permissions.userRole === 'owner' ? 'bg-red-500 text-gray-950' :
                            permissions.userRole === 'editor' ? 'bg-blue-500 text-gray-950' :
                            'bg-slate-500 text-gray-950'
                          }`}>
                            {permissions.userRole}
                          </span>
                        </div>
                        {project.description && (
                          <p className="text-sm text-slate-300 mb-2">{project.description}</p>
                        )}
                        <p className="text-xs text-slate-400">
                          Archived: {new Date(project.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRestore(project)}
                        className="ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-500 text-white hover:bg-blue-600"
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
        <div className="px-6 py-4 border-t border-slate-700 flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-slate-300 hover:text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
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
    </div>
  );
};

export default ArchivedProjectsModal;
