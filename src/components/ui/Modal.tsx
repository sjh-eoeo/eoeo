import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'lg',
}) => {
  if (!isOpen) return null;

  const sizeClass = SIZE_CLASSES[size];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className={`bg-gray-800 rounded-lg shadow-xl w-full ${sizeClass} max-h-[90vh] flex flex-col border border-gray-600 transform transition-transform duration-300 overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center gap-4 p-4 border-b border-gray-700 flex-shrink-0">
          <h3 className="text-lg font-semibold text-white truncate break-words">
            {title || 'Details'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold leading-none flex-shrink-0"
            aria-label="Close modal"
          >
            &times;
          </button>
        </header>
        <main className="p-6 overflow-y-auto overflow-x-hidden break-words">
          {children}
        </main>
      </div>
    </div>
  );
};
