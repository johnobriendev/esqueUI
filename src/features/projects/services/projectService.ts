//src/features/project/services/projectService.ts
import api from '../../../shared/lib/api';
import { Project } from '../../../types';

// Types for API requests
interface CreateProjectRequest {
  name: string;
  description?: string;
}

interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

// Project API service
const projectService = {
  // Get all projects for the current user
  getProjects: async (): Promise<Project[]> => {
    const response = await api.get('/projects');
    return response.data;
  },
  
  // Get a single project by ID
  getProject: async (projectId: string): Promise<Project> => {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
  },
  
  // Create a new project
  createProject: async (data: CreateProjectRequest): Promise<Project> => {
    const response = await api.post('/projects', data);
    return response.data;
  },
  
  // Update an existing project
  updateProject: async (projectId: string, updates: UpdateProjectRequest): Promise<Project> => {
    const response = await api.patch(`/projects/${projectId}`, updates);
    return response.data;
  },
  
  // Delete a project
  deleteProject: async (projectId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}`);
  },

  // Get archived projects
  getArchivedProjects: async (): Promise<Project[]> => {
    const response = await api.get('/projects/archived');
    return response.data;
  },

  // Archive project (owner only)
  archiveProject: async (projectId: string): Promise<void> => {
    await api.patch(`/projects/${projectId}/archive`);
  },

  // Unarchive project (owner only)
  unarchiveProject: async (projectId: string): Promise<Project> => {
    const response = await api.patch(`/projects/${projectId}/unarchive`);
    return response.data;
  },

  // Hide project (collaborator only)
  hideProject: async (projectId: string): Promise<void> => {
    await api.patch(`/projects/${projectId}/hide`);
  },

  // Unhide project (collaborator only)
  unhideProject: async (projectId: string): Promise<Project> => {
    const response = await api.patch(`/projects/${projectId}/unhide`);
    return response.data;
  },

  // Leave project (collaborator only)
  leaveProject: async (projectId: string): Promise<void> => {
    await api.delete(`/team/projects/${projectId}/leave`);
  }
};

export default projectService;