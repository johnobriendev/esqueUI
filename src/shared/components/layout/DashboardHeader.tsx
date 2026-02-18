// src/components/dashboard/DashboardHeader.tsx
import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { clearProjects } from '../../../features/projects/store/projectsSlice';
import { clearPersistedState } from '../../../app/store';
import {
  selectPendingInvitations,
  fetchPendingInvitations
} from '../../../features/collaboration/store/collaborationSlice';
import {
  openInvitationsPanel,
  selectIsInvitationsPanelOpen,
} from '../../../features/ui/store/uiSlice';
import InvitationsPanel from '../../../features/collaboration/components/InvitationsPanel';
import { useAppAuth } from '../../../features/auth/components/AuthProvider';
import ProfileDropdown from './ProfileDropdown';
import { openArchivedProjectsModal } from '../../../features/ui/store/uiSlice';

interface DashboardActions {
  onCreateProject: () => void;
  onOpenUrgentTasks: () => void;
  onOpenPalette?: () => void;
}

interface DashboardHeaderProps {
  dashboardActions?: DashboardActions;
  archivedCount?: number;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ dashboardActions, archivedCount = 0 }) => {
  const { user, logout, isAuthenticated } = useAuth0();
  const dispatch = useAppDispatch();
  const pendingInvitations = useAppSelector(selectPendingInvitations);
  const isInvitationsPanelOpen = useAppSelector(selectIsInvitationsPanelOpen);
  const { isAppReady } = useAppAuth();

  useEffect(() => {
    if (isAuthenticated && isAppReady) {
      dispatch(fetchPendingInvitations());
    }
  }, [isAuthenticated, isAppReady, dispatch]);

  const handleLogout = () => {
    dispatch(clearProjects());
    clearPersistedState();
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const handleOpenInvitations = () => {
    dispatch(openInvitationsPanel());
  };

  return (
    <>
      <header className="dash-surface shadow-lg border-b dash-border">
        <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {/* Make logo responsive - smaller on mobile */}
              <h1 className="text-2xl sm:text-3xl font-bold dash-text">Esque</h1>
            </div>

            {isAuthenticated && user && (
              <>
                {/* Desktop navigation - hidden on mobile */}
                <div className="hidden md:flex items-center space-x-3">
                  {dashboardActions && (
                    <>
                      <button
                        onClick={dashboardActions.onOpenUrgentTasks}
                        className="px-4 py-1.5 dash-btn2 rounded-lg transition-colors shadow-sm hover:shadow flex items-center text-sm"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Urgent Tasks
                      </button>
                      <button
                        onClick={dashboardActions.onCreateProject}
                        className="px-4 py-1.5 dash-accent rounded-lg transition-colors shadow-sm hover:shadow flex items-center text-sm"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create Project
                      </button>
                    </>
                  )}
                  <button
                    onClick={handleOpenInvitations}
                    className="relative px-3 py-1.5 dash-text-muted hover:dash-text rounded flex items-center"
                  >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Invitations</span>
                    {pendingInvitations.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {pendingInvitations.length}
                      </span>
                    )}
                  </button>
                  <ProfileDropdown
                    user={user}
                    archivedCount={archivedCount}
                    onOpenArchived={() => dispatch(openArchivedProjectsModal())}
                    onOpenPalette={dashboardActions?.onOpenPalette}
                    onLogout={handleLogout}
                  />
                </div>

                {/*  Mobile menu button - visible only on mobile */}
                <div className="md:hidden flex items-center space-x-2">
                  {dashboardActions && (
                    <>
                      <button
                        onClick={dashboardActions.onOpenUrgentTasks}
                        className="px-3 py-1.5 dash-btn2 rounded-lg transition-colors shadow-sm hover:shadow flex items-center text-sm"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Urgent
                      </button>
                      <button
                        onClick={dashboardActions.onCreateProject}
                        className="px-3 py-1.5 dash-accent rounded-lg transition-colors shadow-sm hover:shadow flex items-center text-sm"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create
                      </button>
                    </>
                  )}
                  {/* Mobile invitations button - icon only */}
                  <button
                    onClick={handleOpenInvitations}
                    className="relative p-2 dash-text-muted rounded"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {pendingInvitations.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {pendingInvitations.length}
                      </span>
                    )}
                  </button>

                  {/* Profile dropdown */}
                  <ProfileDropdown
                    user={user}
                    archivedCount={archivedCount}
                    onOpenArchived={() => dispatch(openArchivedProjectsModal())}
                    onOpenPalette={dashboardActions?.onOpenPalette}
                    onLogout={handleLogout}
                  />
                </div>
              </>
            )}
          </div>

        </div>
      </header>
      <InvitationsPanel isOpen={isInvitationsPanelOpen} />
    </>
  );
};

export default DashboardHeader;
