import React from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import ConflictResolutionModal from '../tasks/components/ConflictResolutionModal';
import { selectPendingConflict, clearConflict } from './conflictSlice';
import { settle } from './conflictRegistry';

const ConflictController: React.FC = () => {
  const dispatch = useAppDispatch();
  const pending = useAppSelector(selectPendingConflict);

  if (!pending) return null;

  const { id, conflict, userChanges } = pending;

  const handleResolve = (resolution: 'keep_mine' | 'take_theirs' | 'merge') => {
    const mapped = resolution === 'merge' ? 'cancel' : resolution;
    dispatch(clearConflict());
    settle(id, mapped);
  };

  const handleCancel = () => {
    dispatch(clearConflict());
    settle(id, 'cancel');
  };

  return (
    <ConflictResolutionModal
      isOpen={true}
      conflict={conflict}
      userChanges={userChanges}
      onResolve={handleResolve}
      onCancel={handleCancel}
    />
  );
};

export default ConflictController;
