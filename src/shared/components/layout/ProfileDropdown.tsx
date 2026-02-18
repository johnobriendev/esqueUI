// src/components/layout/ProfileDropdown.tsx
import React, { useState, useRef, useEffect } from 'react';

interface ProfileDropdownProps {
  user: any;
  archivedCount: number;
  onOpenArchived: () => void;
  onOpenPalette?: () => void;
  onLogout: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  user,
  archivedCount,
  onOpenArchived,
  onOpenPalette,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get first letter for profile circle
  const getInitial = () => {
    if (user.name) return user.name.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 rounded-full dash-accent font-semibold transition-colors"
      >
        {getInitial()}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 dash-surface rounded-lg shadow-xl border dash-border z-50">
          {/* User info section */}
          <div className="px-4 py-3 dash-surface-alt border-b dash-border rounded-t-lg">
            <p className="text-sm font-semibold dash-text truncate">
              {user.name || 'User'}
            </p>
            <p className="text-xs dash-text-muted truncate">{user.email}</p>
          </div>

          {/* Menu options */}
          <div className="py-1">
            <button
              onClick={() => {
                onOpenArchived();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm dash-text hover:dash-surface-alt flex items-center justify-between transition-colors"
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                View Archived Projects
              </span>
              {archivedCount > 0 && (
                <span className="ml-2 dash-accent text-xs font-medium px-2 py-0.5 rounded-full">
                  {archivedCount}
                </span>
              )}
            </button>

            {onOpenPalette && (
              <button
                onClick={() => {
                  onOpenPalette();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm dash-text hover:dash-surface-alt flex items-center transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                Change Theme
              </button>
            )}

            <button
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm dash-text hover:dash-surface-alt flex items-center border-t dash-border transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
