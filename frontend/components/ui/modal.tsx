'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className,
  overlayClassName,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}) => {
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, closeOnEscape]);

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/80 transition-opacity duration-200',
          overlayClassName
        )}
        onClick={handleOverlayClick}
      />
      
      {/* Modal Content */}
      <div
        className={cn(
          'relative z-50 w-full max-w-lg mx-4 bg-background border rounded-lg shadow-lg transition-all duration-200 animate-in fade-in-0 zoom-in-95',
          className
        )}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        
        {children}
      </div>
    </div>
  );
};

interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const ModalHeader: React.FC<ModalHeaderProps> = ({ className, ...props }) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left p-6 pb-0',
      className
    )}
    {...props}
  />
);
ModalHeader.displayName = 'ModalHeader';

interface ModalTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const ModalTitle: React.FC<ModalTitleProps> = ({ className, ...props }) => (
  <h2
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
);
ModalTitle.displayName = 'ModalTitle';

interface ModalDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const ModalDescription: React.FC<ModalDescriptionProps> = ({ className, ...props }) => (
  <p
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
);
ModalDescription.displayName = 'ModalDescription';

interface ModalContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const ModalContent: React.FC<ModalContentProps> = ({ className, ...props }) => (
  <div
    className={cn('p-6 pt-0', className)}
    {...props}
  />
);
ModalContent.displayName = 'ModalContent';

interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const ModalFooter: React.FC<ModalFooterProps> = ({ className, ...props }) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-0',
      className
    )}
    {...props}
  />
);
ModalFooter.displayName = 'ModalFooter';

export {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
};
