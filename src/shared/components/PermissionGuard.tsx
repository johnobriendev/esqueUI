//src/components/common/PermissionGuard.tsx

import React from 'react';
import { useProjectPermissions } from '../lib/useProjectPermissions';

interface PermissionGuardProps {
  children: React.ReactNode;
  action: 'read' | 'write' | 'invite' | 'manage_team' | 'delete_project';
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  action,
  fallback = null,
  showFallback = false,
}) => {
  const perms = useProjectPermissions();

  const hasPermission = (() => {
    switch (action) {
      case 'read': return perms.canRead;
      case 'write': return perms.can.edit;
      case 'invite': return perms.can.invite;
      case 'manage_team': return perms.canManageTeam;
      case 'delete_project': return perms.canDeleteProject;
      default: return false;
    }
  })();

  if (hasPermission) {
    return <>{children}</>;
  }

  if (showFallback && fallback) {
    return <>{fallback}</>;
  }

  return null;
};

export default PermissionGuard;

// Convenience components for common use cases
export const WriteGuard: React.FC<Omit<PermissionGuardProps, 'action'>> = (props) => (
  <PermissionGuard {...props} action="write" />
);

export const OwnerGuard: React.FC<Omit<PermissionGuardProps, 'action'>> = (props) => (
  <PermissionGuard {...props} action="manage_team" />
);

export const InviteGuard: React.FC<Omit<PermissionGuardProps, 'action'>> = (props) => (
  <PermissionGuard {...props} action="invite" />
);