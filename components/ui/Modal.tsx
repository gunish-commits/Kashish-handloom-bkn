import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hideHeader?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'lg',
  hideHeader = false,
}: ModalProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };
  const sizeClass = sizeClasses[size] || 'max-w-lg';

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto">
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-ink/75 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Dialog Box */}
      <div className={`relative w-full ${sizeClass} bg-card-white border border-border-dark/10 rounded-[4px] shadow-[0_20px_40px_rgba(15,10,5,0.25)] flex flex-col z-10 max-h-[90vh] overflow-hidden page-fade-in`}>
        {/* Header */}
        {!hideHeader && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-150">
            <h3 className="font-sans font-medium text-sm text-ink uppercase tracking-wider">
              {title || 'Message'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-ink text-2xl leading-none transition-colors duration-150 p-1 cursor-pointer focus:outline-none"
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 font-sans text-sm text-[#444] leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}
