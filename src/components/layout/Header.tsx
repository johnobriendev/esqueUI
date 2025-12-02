//src/components/layout/Header.tsx 

import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  setViewMode,
  setKanbanGroupBy,
  openTaskModal,
  setSearchTerm,
  setFilterStatus,
  setFilterPriority
} from '../../features/ui/store/uiSlice';
import { ViewMode, KanbanGroupBy, TaskStatus, TaskPriority } from '../../types';
import HistoryControls from '../../features/ui/components/HistoryControls';
import { useAuth0 } from '@auth0/auth0-react';
import { openTeamModal } from '../../features/ui/store/uiSlice';
import { WriteGuard, InviteGuard } from '../common/PermissionGuard';
import { selectCurrentProject } from '../../features/projects/store/projectsSlice';
import { getProjectPermissions } from '../../lib/permissions';

interface HeaderProps {
  showBackButton?: boolean;
  projectName?: string;
}

const Header: React.FC<HeaderProps> = (props) => {
  const { showBackButton = false, projectName } = props;
  const dispatch = useAppDispatch();
  const viewMode = useAppSelector(state => state.ui.viewMode);
  const kanbanGroupBy = useAppSelector(state => state.ui.kanbanGroupBy);
  const filterConfig = useAppSelector(state => state.ui.filterConfig);
  const { user, logout, isAuthenticated } = useAuth0();

  const currentProject = useAppSelector(selectCurrentProject);
  const permissions = getProjectPermissions(currentProject);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const overflowMenuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target) &&
          !mobileMenuButtonRef.current?.contains(target) &&
          !overflowMenuButtonRef.current?.contains(target)) {
        setIsMobileMenuOpen(false);
      }
      
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isMobileMenuOpen || isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen, isUserMenuOpen]);

  const handleOpenTeam = () => {
    dispatch(openTeamModal());
  };

  const handleViewModeChange = (mode: ViewMode) => {
    dispatch(setViewMode(mode));
  };

  const handleKanbanGroupByChange = (groupBy: KanbanGroupBy) => {
    dispatch(setKanbanGroupBy(groupBy));
  };

  const handleCreateTask = () => {
    dispatch(openTaskModal(null));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchTerm(e.target.value));
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setFilterStatus(e.target.value as TaskStatus | 'all'));
  };

  const handlePriorityFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setFilterPriority(e.target.value as TaskPriority | 'all'));
  };

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded) {
      dispatch(setSearchTerm(''));
    }
  };

  const toggleMobileMenu = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-blue-950 shadow-lg border-b border-blue-900 relative flex-shrink-0">
      <div className="px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between h-10 gap-2">
          {/* Left section - Back button and title - PROTECTED SPACE */}
          <div className="flex items-center space-x-3 min-w-0 flex-1 max-w-[50%]">
            {showBackButton && (
              <button
                onClick={() => window.history.back()}
                className="flex-shrink-0 text-slate-300 hover:text-blue-50 text-sm whitespace-nowrap"
              >
                ← Back
              </button>
            )}

            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-blue-50 truncate min-w-0">
              {projectName}
            </h1>
          </div>

          {/* Right section - Actions and user */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            
            {/* History Controls - Desktop only, most important for power users */}
            <WriteGuard>
              <div className="hidden xl:block">
                <HistoryControls />
              </div>
            </WriteGuard>

            {/* Desktop search - fixed width, never expands */}
            <div className="hidden lg:block">
              <input
                type="text"
                placeholder="Search tasks..."
                value={filterConfig.searchTerm}
                onChange={handleSearchChange}
                className="w-40 xl:w-48 h-8 px-3 text-sm bg-slate-900 text-slate-300 placeholder-slate-500 border border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Desktop Filters - Only on large screens */}
            <div className="hidden xl:flex items-center space-x-1">
              <select
                value={filterConfig.status}
                onChange={handleStatusFilterChange}
                className="h-8 px-2 text-sm bg-slate-900 text-slate-300 border border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Status</option>
                <option value="not started">Not Started</option>
                <option value="in progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>

              <select
                value={filterConfig.priority}
                onChange={handlePriorityFilterChange}
                className="h-8 px-2 text-sm bg-slate-900 text-slate-300 border border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Mobile search toggle */}
            <div className="lg:hidden">
              <button
                onClick={toggleSearch}
                className="h-8 w-8 flex items-center justify-center text-slate-300 hover:text-blue-50 rounded-md hover:bg-blue-900"
              >
                🔍
              </button>
            </div>

            {/* View Mode Toggle - Tablet and up */}
            <div className="hidden md:flex items-center gap-2">
              <div className="flex bg-slate-800 rounded-md p-1">
                <button
                  onClick={() => handleViewModeChange('list')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${viewMode === 'list'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-slate-300 hover:text-blue-50'
                    }`}
                >
                  List
                </button>
                <button
                  onClick={() => handleViewModeChange('kanban')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${viewMode === 'kanban'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-slate-300 hover:text-blue-50'
                    }`}
                >
                  Board
                </button>
              </div>

              {/* Kanban Group By Toggle - Only show when in kanban view */}
              {viewMode === 'kanban' && (
                <div className="flex bg-slate-800 rounded-md p-1">
                  <button
                    onClick={() => handleKanbanGroupByChange('priority')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${kanbanGroupBy === 'priority'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-slate-300 hover:text-blue-50'
                      }`}
                    title="Group by Priority"
                  >
                    Priority
                  </button>
                  <button
                    onClick={() => handleKanbanGroupByChange('status')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${kanbanGroupBy === 'status'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-slate-300 hover:text-blue-50'
                      }`}
                    title="Group by Status"
                  >
                    Status
                  </button>
                </div>
              )}
            </div>

            {/* Menu button for overflow items on laptop */}
            <div className="hidden md:block xl:hidden">
              <button
                ref={overflowMenuButtonRef}
                onClick={toggleMobileMenu}
                className="h-8 w-8 flex items-center justify-center text-slate-300 hover:text-blue-50 rounded-md hover:bg-blue-900"
                title="More options"
              >
                ⋯
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                ref={mobileMenuButtonRef}
                onClick={toggleMobileMenu}
                className="h-8 w-8 flex items-center justify-center text-slate-300 hover:text-blue-50 rounded-md hover:bg-blue-900"
              >
                ☰
              </button>
            </div>

            {/* Create Task Button - Always visible for write users */}
            <WriteGuard
              fallback={
                <div className="relative group">
                  <button
                    disabled
                    className="h-8 px-2 sm:px-3 bg-slate-700 text-slate-500 text-sm rounded-md cursor-not-allowed"
                  >
                    <span className="hidden sm:inline">+ Task</span>
                    <span className="sm:hidden">+</span>
                  </button>
                </div>
              }
              showFallback={!!currentProject}
            >
              <button
                onClick={handleCreateTask}
                className="h-8 px-2 sm:px-3 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
              >
                <span className="hidden sm:inline">+ Task</span>
                <span className="sm:hidden">+</span>
              </button>
            </WriteGuard>

            {/* Team Button - Only on XL screens where we have space */}
            {currentProject && (
              <InviteGuard showFallback={true}>
                <div className="hidden xl:block">
                  <button
                    onClick={handleOpenTeam}
                    className="h-8 px-3 bg-slate-700 text-white text-sm rounded-md hover:bg-slate-600 transition-colors"
                  >
                    Team
                  </button>
                </div>
              </InviteGuard>
            )}

            {/* User profile */}
            {isAuthenticated && user && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-1 h-8 px-1 sm:px-2 rounded-md hover:bg-blue-900 transition-colors"
                >
                  {user.picture && (
                    <img
                      src={user.picture}
                      alt="Profile"
                      className="h-6 w-6 rounded-full border border-slate-600"
                    />
                  )}
                  <span className="hidden lg:inline text-sm text-slate-300 max-w-20 truncate">
                    {user.name}
                  </span>
                  <span className="text-slate-400 text-xs">▼</span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-md shadow-lg z-50">
                    <div className="py-2">
                      <div className="px-4 py-2 border-b border-slate-700">
                        <div className="text-sm font-medium text-blue-50 truncate">{user.name}</div>
                        <div className="text-xs text-slate-400">{user.email}</div>
                        {currentProject && (
                          <div className="text-xs text-slate-400 mt-1">
                            Role: <span className={`font-medium ${permissions.userRole === 'owner' ? 'text-red-400' :
                                permissions.userRole === 'editor' ? 'text-blue-400' :
                                  'text-slate-400'
                              }`}>
                              {permissions.userRole}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile search overlay */}
        {isSearchExpanded && (
          <div className="lg:hidden mt-3 pb-2">
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Search tasks..."
                value={filterConfig.searchTerm}
                onChange={handleSearchChange}
                className="flex-1 h-8 px-3 text-sm bg-slate-900 text-slate-300 placeholder-slate-500 border border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={toggleSearch}
                className="ml-2 text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Mobile dropdown menu */}
        {isMobileMenuOpen && (
          <div
            className="absolute top-full left-0 right-0 bg-slate-800 border-t border-slate-700 shadow-lg z-50"
            ref={mobileMenuRef}
          >
            <div className="px-4 py-3 space-y-3">
              {/* View toggle for mobile */}
              <div className="md:hidden">
                <div className="flex bg-slate-900 rounded-md p-1">
                  <button
                    onClick={() => {
                      handleViewModeChange('list');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${viewMode === 'list'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-slate-300 hover:text-blue-50'
                      }`}
                  >
                    List View
                  </button>
                  <button
                    onClick={() => {
                      handleViewModeChange('kanban');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${viewMode === 'kanban'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-slate-300 hover:text-blue-50'
                      }`}
                  >
                    Board View
                  </button>
                </div>

                {/* Kanban Group By Toggle - Only show when in kanban view */}
                {viewMode === 'kanban' && (
                  <div className="mt-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">Group By</label>
                    <div className="flex bg-slate-900 rounded-md p-1">
                      <button
                        onClick={() => {
                          handleKanbanGroupByChange('priority');
                          setIsMobileMenuOpen(false);
                        }}
                        className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${kanbanGroupBy === 'priority'
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'text-slate-300 hover:text-blue-50'
                          }`}
                      >
                        Priority
                      </button>
                      <button
                        onClick={() => {
                          handleKanbanGroupByChange('status');
                          setIsMobileMenuOpen(false);
                        }}
                        className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${kanbanGroupBy === 'status'
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'text-slate-300 hover:text-blue-50'
                          }`}
                      >
                        Status
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* History Controls for mobile/tablet */}
              <WriteGuard>
                <div className="xl:hidden">
                  <div className="text-xs font-medium text-slate-300 mb-2">History</div>
                  <HistoryControls />
                </div>
              </WriteGuard>

              {/* Filters */}
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
                  <select
                    value={filterConfig.status}
                    onChange={handleStatusFilterChange}
                    className="w-full h-8 px-2 text-sm bg-slate-900 text-slate-300 border border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="not started">Not Started</option>
                    <option value="in progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={filterConfig.priority}
                    onChange={handlePriorityFilterChange}
                    className="w-full h-8 px-2 text-sm bg-slate-900 text-slate-300 border border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Team Management - Available on all screens smaller than XL */}
              {currentProject && (
                <div className="xl:hidden pt-2 border-t border-slate-700">
                  <InviteGuard showFallback={true}>
                    <button
                      onClick={() => {
                        handleOpenTeam();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 bg-slate-700 text-white text-sm rounded-md hover:bg-slate-600 transition-colors"
                    >
                      Team Management
                    </button>
                  </InviteGuard>
                </div>
              )}

              {/* Read-only indicator */}
              {currentProject && !permissions.canWrite && (
                <div className="text-xs text-slate-400 italic text-center pt-2 border-t border-slate-700">
                  Read-only access
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;