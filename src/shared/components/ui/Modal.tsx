import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  disabled?: boolean;
  containerClassName?: string;
  children: React.ReactNode;
}

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  size = 'md',
  disabled = false,
  containerClassName,
  children,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !disabled) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div
        className={`${containerClassName ?? 'bg-slate-800 border border-slate-700'} rounded-lg shadow-xl mx-4 w-full ${sizeClasses[size]} max-h-[85vh] overflow-y-auto p-6`}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;
