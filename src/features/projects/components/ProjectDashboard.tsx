// src/features/projects/components/ProjectDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import {
  fetchProjects,
  selectAllProjects,
  selectArchivedCount,
  setCurrentProject,
  selectProjectsLoading,
  selectProjectsError,
  createProject,
  updateProject,
  deleteProject,
  archiveProject,
  hideProject,
  leaveProject,
} from '../store/projectsSlice';
import { setCurrentProjectId, openUrgentTasksModal } from '../../ui/store/uiSlice';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../../../types';
import DashboardHeader from '../../../shared/components/layout/DashboardHeader';
import { useAppAuth } from '../../auth/components/AuthProvider';
import { getProjectPermissions } from '../../../shared/lib/permissions';
import ProjectDeleteConfirmModal from './ProjectDeleteConfirmModal';
import ProjectArchiveConfirmModal from './ProjectArchiveConfirmModal';
import ProjectFormModal from './ProjectFormModal';
import UrgentTasksModal from '../../tasks/components/UrgentTasksModal';
import ArchivedProjectsModal from './ArchivedProjectsModal';



// Dashboard component with modern design patterns
const ProjectDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const projects = useAppSelector(selectAllProjects);
  const archivedCount = useAppSelector(selectArchivedCount);
  const isLoading = useAppSelector(selectProjectsLoading);
  const error = useAppSelector(selectProjectsError);
  const { isAuthenticated } = useAuth0();
  const { isAppReady } = useAppAuth();


  // State for project form
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [projectToArchive, setProjectToArchive] = useState<Project | null>(null);
  const [archiveAction, setArchiveAction] = useState<'archive' | 'unarchive'>('archive');

  // Fetch projects after auth is ready
  useEffect(() => {
    if (isAuthenticated && isAppReady) {
      //console.log('App is ready, fetching projects');
      dispatch(fetchProjects());

    }
  }, [dispatch, isAuthenticated, isAppReady]);

  useEffect(() => {
    if (permissionError) {
      const timer = setTimeout(() => {
        setPermissionError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [permissionError]);


  // Form handling functions
  const handleOpenCreateForm = () => {
    setIsCreating(true);
    setIsEditing(false);
    setEditingProject(null);
    setProjectName('');
    setProjectDescription('');
  };

  const handleOpenEditForm = (project: Project) => {
    const permissions = getProjectPermissions(project);
    if (!permissions.canWrite) {
      setPermissionError('You don\'t have permission to edit this project.');
      return;
    }

    setIsEditing(true);
    setIsCreating(false);
    setEditingProject(project);
    setProjectName(project.name);
    setProjectDescription(project.description || '');
  };

  const handleCloseForm = () => {
    setIsCreating(false);
    setIsEditing(false);
    setEditingProject(null);
    setProjectName('');
    setProjectDescription('');
  };

  // Project CRUD operations
  const handleCreateProject = () => {
    if (projectName.trim()) {
      dispatch(createProject({
        name: projectName.trim(),
        description: projectDescription.trim() || undefined
      }))
        .unwrap()
        .then((newProject) => {

          handleCloseForm();
          // Navigate to the new project
          handleSelectProject(newProject);
        })
        .catch((error) => {
          console.error('Failed to create project:', error);
        });
    }
  };

  const handleUpdateProject = () => {
    if (editingProject && projectName.trim()) {
      dispatch(updateProject({
        projectId: editingProject.id,
        updates: {
          name: projectName.trim(),
          description: projectDescription.trim() || undefined
        }
      }))
        .unwrap()
        .then(() => {
          handleCloseForm();
        })
        .catch((error) => {
          console.error('Failed to update project:', error);
        });
    }
  };

  //opens modal
  const handleDeleteProject = (project: Project) => {
    const permissions = getProjectPermissions(project);
    if (!permissions.canDeleteProject) {
      setPermissionError('Only project owners can delete projects.');
      return;
    }

    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  //confirms deletion
  const confirmDeleteProject = async (project: Project) => {
    try {
      await dispatch(deleteProject(project.id)).unwrap();

      // Clear the current project ID from UI state if it was the deleted project
      dispatch(setCurrentProjectId(null));

      // Close modal
      setShowDeleteModal(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
      // Error will be handled by the modal component
      throw error;
    }
  };

  // Close delete modal
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setProjectToDelete(null);
  };

  const handleSelectProject = (project: Project) => {

    dispatch(setCurrentProject(project));
    dispatch(setCurrentProjectId(project.id));
    navigate(`/projects/${project.id}`);
  };

  const handleRetry = () => {
    console.log('Retrying project fetch');
    dispatch(fetchProjects());
  };

  const handleArchiveProject = (project: Project) => {
    setProjectToArchive(project);
    setArchiveAction('archive');
    setShowArchiveModal(true);
  };

  const confirmArchiveProject = async (project: Project) => {
    await dispatch(archiveProject(project.id)).unwrap();
  };

  const handleCloseArchiveModal = () => {
    setShowArchiveModal(false);
    setProjectToArchive(null);
  };

  const handleHideProject = (project: Project) => {
    dispatch(hideProject(project.id))
      .unwrap()
      .catch((error) => {
        setPermissionError('Failed to hide project.');
      });
  };

  const handleLeaveProject = (project: Project) => {
    if (window.confirm(`Are you sure you want to leave "${project.name}"? You will need to be re-invited to access it again.`)) {
      dispatch(leaveProject(project.id))
        .unwrap()
        .catch((error) => {
          setPermissionError('Failed to leave project.');
        });
    }
  };

  // Show loading while app is initializing (before API calls can be made)
  if (!isAppReady) {
    return (
      <div className="min-h-screen bg-slate-900">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="relative mb-4">
                <div className="h-16 w-16 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin mx-auto"></div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-16 w-16 rounded-full border-l-2 border-r-2 border-blue-300 animate-pulse"></div>
              </div>
              <p className="text-slate-300">Initializing application...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state - only show if we don't have any projects and we're loading
  if (isLoading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="relative mb-4">
                <div className="h-16 w-16 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin mx-auto"></div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-16 w-16 rounded-full border-l-2 border-r-2 border-blue-300 animate-pulse"></div>
              </div>
              <p className="text-slate-300">Loading your projects...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  //  Error state with retry functionality
  if (error) {
    return (
      <div className="min-h-screen bg-slate-900">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center py-12 px-6 bg-slate-800 rounded-xl shadow-sm border border-red-900">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-900/30 mb-6">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-blue-50 mb-2">Error Loading Projects</h2>
            <p className="text-slate-300 mb-6">{error}</p>
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm hover:shadow"
              disabled={isLoading}
            >
              {isLoading ? 'Retrying...' : 'Try Again'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-900">
        <DashboardHeader
          dashboardActions={{
            onCreateProject: handleOpenCreateForm,
            onOpenUrgentTasks: () => dispatch(openUrgentTasksModal())
          }}
          archivedCount={archivedCount}
        />
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Permission Error Banner */}
          {permissionError && (
            <div className="mb-6 bg-red-900/20 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-300">{permissionError}</p>
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

          {projects.length === 0 ? (
            <div className="text-center py-16 bg-slate-800 rounded-xl shadow-sm border border-slate-700">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-950 mb-6">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="text-xl font-medium text-blue-50 mb-2">No projects yet</h2>
              <p className="text-slate-300 mb-8">Create your first project to get started</p>
              <button
                onClick={handleOpenCreateForm}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm hover:shadow"
              >
                Create Your First Project
              </button>
            </div>
          ) : (
            // Project grid - 4 columns for smaller cards
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {projects.map((project) => {
                // Get permissions for each project
                const permissions = getProjectPermissions(project);

                return (
                  <div
                    key={project.id}
                    className="rounded-xl overflow-hidden bg-slate-800 shadow-sm hover:shadow-md transition-all border border-slate-700 hover:border-slate-600 flex flex-col"
                  >
                    {/* Card content - smaller, no description */}
                    <div className="p-4 flex-grow">
                      <div className="flex items-start justify-between mb-3">
                        <h2 className="text-lg font-semibold text-blue-50 line-clamp-1 flex-1">{project.name}</h2>

                        <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${permissions.userRole === 'owner' ? 'bg-indigo-500 text-indigo-950' :
                          permissions.userRole === 'editor' ? 'bg-blue-500 text-blue-950' :
                            'bg-slate-600 text-slate-200'
                          }`}>
                          {permissions.userRole}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Card footer */}
                    <div className="px-4 py-3 bg-slate-900 border-t border-slate-700 flex justify-between items-center">
                      <div className="space-x-3">
                        {permissions.canWrite && (
                          <button
                            onClick={() => handleOpenEditForm(project)}
                            className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
                          >
                            <span className="flex items-center">
                              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </span>
                          </button>
                        )}

                        {permissions.isOwner && (
                          <>
                            <button
                              onClick={() => handleArchiveProject(project)}
                              className="text-sm text-slate-400 hover:text-amber-400 transition-colors"
                            >
                              <span className="flex items-center">
                                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                                Archive
                              </span>
                            </button>
                            <button
                              onClick={() => handleDeleteProject(project)}
                              className="text-sm text-slate-400 hover:text-red-400 transition-colors"
                            >
                              <span className="flex items-center">
                                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </span>
                            </button>
                          </>
                        )}

                        {!permissions.isOwner && (
                          <>
                            <button
                              onClick={() => handleHideProject(project)}
                              className="text-sm text-slate-400 hover:text-amber-400 transition-colors"
                            >
                              <span className="flex items-center">
                                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                                Hide
                              </span>
                            </button>
                            <button
                              onClick={() => handleLeaveProject(project)}
                              className="text-sm text-slate-400 hover:text-red-400 transition-colors"
                            >
                              <span className="flex items-center">
                                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Leave
                              </span>
                            </button>
                          </>
                        )}

                        {!permissions.canWrite && permissions.isViewer && (
                          <span className="text-xs text-slate-500 italic">Read-only</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleSelectProject(project)}
                        className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors shadow-sm hover:shadow-md"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Project Form Modal */}
      <ProjectFormModal
        isOpen={isCreating || isEditing}
        isEditing={isEditing}
        editingProject={editingProject}
        projectName={projectName}
        projectDescription={projectDescription}
        onProjectNameChange={setProjectName}
        onProjectDescriptionChange={setProjectDescription}
        onClose={handleCloseForm}
        onSubmit={isCreating ? handleCreateProject : handleUpdateProject}
      />

      {/* Project Delete Confirmation Modal */}
      <ProjectDeleteConfirmModal
        isOpen={showDeleteModal}
        project={projectToDelete}
        onClose={handleCloseDeleteModal}
        onConfirm={confirmDeleteProject}
      />

      {/* Urgent Tasks Modal */}
      <UrgentTasksModal />

      {/* Archived Projects Modal */}
      <ArchivedProjectsModal />

      {/* Archive/Unarchive Confirmation Modal */}
      <ProjectArchiveConfirmModal
        isOpen={showArchiveModal}
        project={projectToArchive}
        action={archiveAction}
        onClose={handleCloseArchiveModal}
        onConfirm={confirmArchiveProject}
      />
    </>
  );
};

export default ProjectDashboard;


