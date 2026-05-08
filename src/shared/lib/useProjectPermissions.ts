import { useMemo } from 'react';
import { useAppSelector } from '../../app/hooks';
import { selectCurrentProject } from '../../features/projects/store/projectsSlice';
import { getProjectPermissions } from './permissions';

export const useProjectPermissions = () => {
  const currentProject = useAppSelector(selectCurrentProject);
  return useMemo(() => {
    const p = getProjectPermissions(currentProject);
    return {
      ...p,
      can: {
        edit: p.canWrite,
        delete: p.canWrite,
        invite: p.canInvite,
      },
    };
  }, [currentProject]);
};
