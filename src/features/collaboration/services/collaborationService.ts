// src/features/collaboration/services/collaborationService.ts

import api from '../../../shared/lib/api';
import { ProjectMember, Invitation, UserRole } from '../../../types';

const collaborationService = {
  getProjectMembers: async (projectId: string): Promise<ProjectMember[]> => {
    const response = await api.get(`/team/projects/${projectId}/collaborators`);
    return response.data;
  },

  getPendingInvitations: async (): Promise<Invitation[]> => {
    const response = await api.get('/team/users/invitations');
    return response.data;
  },

  inviteUser: async (projectId: string, email: string, role: string): Promise<void> => {
    await api.post(`/team/projects/${projectId}/invite`, { email, role });
  },

  updateMemberRole: async (projectId: string, userId: string, role: UserRole): Promise<ProjectMember> => {
    const response = await api.put(`/team/projects/${projectId}/collaborators/${userId}/role`, { role });
    return response.data;
  },

  removeMember: async (projectId: string, userId: string): Promise<void> => {
    await api.delete(`/team/projects/${projectId}/collaborators/${userId}`);
  },

  acceptInvitation: async (invitationToken: string): Promise<unknown> => {
    const response = await api.post(`/team/invitations/${invitationToken}/accept`);
    return response.data;
  },

  declineInvitation: async (invitationId: string): Promise<void> => {
    await api.delete(`/team/invitations/${invitationId}`);
  },
};

export default collaborationService;
