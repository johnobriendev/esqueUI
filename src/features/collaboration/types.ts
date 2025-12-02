// Collaboration-related types
import { UserRole } from '../../shared/types/common';

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  role: UserRole;
  email: string;
  name?: string;
  picture?: string;
  joinedAt: string;
}

export interface Invitation {
  id: string;
  projectId: string;
  project: {
    name: string;
    description?: string;
  };
  sender: {
    email: string;
    name?: string;
  };
  receiverEmail: string;
  role: UserRole;
  status: InvitationStatus;
  token: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

// API request/response types
export interface InviteUserRequest {
  email: string;
  role: UserRole;
}

export interface UpdateMemberRoleRequest {
  role: UserRole;
}

export interface AcceptInvitationRequest {
  token: string;
}

// Collaboration state
export interface CollaborationState {
  // Team members for current project
  projectMembers: ProjectMember[];

  // User's pending invitations across all projects
  pendingInvitations: Invitation[];

  // Loading states
  isLoadingMembers: boolean;
  isLoadingInvitations: boolean;
  isSendingInvitation: boolean;
  isUpdatingRole: boolean;
  isRemovingMember: boolean;
  isAcceptingInvitation: boolean;
  isDecliningInvitation: boolean;

  // Error states
  membersError: string | null;
  invitationsError: string | null;
  inviteError: string | null;
  roleUpdateError: string | null;
  removeError: string | null;
  acceptError: string | null;
  declineError: string | null;
}
