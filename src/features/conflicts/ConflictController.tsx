import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import ConflictResolutionModal from '../tasks/components/ConflictResolutionModal';
import { selectPendingConflict, clearConflict } from './conflictSlice';
import { settleConflict } from './conflictService';

const ConflictController: React.FC = () => {
  const dispatch = useAppDispatch();
  const pending = useAppSelector(selectPendingConflict);

  useEffect(() => {
    if (!pending) return;
    const { id } = pending;
    return () => {
      settleConflict(id, 'cancel');
      dispatch(clearConflict());
    };
  }, [pending?.id, dispatch]);

  if (!pending) return null;

  const { id, conflict, userChanges } = pending;

  const handleResolve = (resolution: 'keep_mine' | 'take_theirs' | 'merge') => {
    const mapped = resolution === 'merge' ? 'cancel' : resolution;
    dispatch(clearConflict());
    settleConflict(id, mapped);
  };

  const handleCancel = () => {
    dispatch(clearConflict());
    settleConflict(id, 'cancel');
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
