import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/helpers';

export default function Modal({ isOpen, onClose, title, children, size = 'md', className = '' }) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black/50 transition-opacity" 
          onClick={onClose}
          aria-hidden="true"
        />
        <div className={cn('relative w-full bg-white rounded-xl shadow-xl', sizes[size], className)}>
          {(title || onClose) && (
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              {title && <h2 id="modal-title" className="text-lg font-semibold text-gray-900">{title}</h2>}
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}