
import React, { useRef, useEffect } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'primary' 
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    // For Confirm/Logout modals, allow click outside to close
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return (
    <div 
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/10 backdrop-blur-md animate-in fade-in duration-300 p-6 pointer-events-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1a2333] w-full max-w-sm rounded-[3rem] p-10 md:p-12 border border-slate-700/50 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300 relative pointer-events-auto"
      >
        <div className="text-center">
          <div className={`w-20 h-20 rounded-[1.8rem] flex items-center justify-center mx-auto mb-10 shadow-2xl ${variant === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-orange-600/10 text-orange-500'}`}>
            {variant === 'danger' ? (
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            ) : (
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            )}
          </div>
          
          <h3 className="text-2xl font-black text-white mb-4 tracking-tighter leading-tight uppercase">{title}</h3>
          <p className="text-slate-400 font-bold mb-10 text-sm px-4 leading-relaxed opacity-80">{message}</p>
          
          <div className="flex flex-col space-y-4">
            <button 
              onClick={() => { onConfirm(); onClose(); }}
              className={`w-full py-5 rounded-2xl font-black transition-all shadow-2xl text-base uppercase tracking-widest hover:scale-[1.02] active:scale-95 ${variant === 'danger' ? 'bg-[#ef4444] hover:bg-red-600 shadow-red-900/40' : 'bg-orange-600 hover:bg-orange-700 shadow-orange-900/60'} text-white`}
            >
              {confirmText}
            </button>
            <button 
              onClick={onClose}
              className="w-full py-2 text-slate-500 hover:text-white font-black text-xs uppercase tracking-[0.3em] transition-colors"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
