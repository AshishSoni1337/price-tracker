'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/lib/redux/hooks';
import { removeToast, ToastMessage } from '@/lib/redux/toastSlice';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const icons = {
  success: <CheckCircle className="text-green-500" size={24} />,
  error: <XCircle className="text-red-500" size={24} />,
  info: <Info className="text-blue-500" size={24} />,
  warning: <AlertTriangle className="text-yellow-500" size={24} />,
};

interface ToastProps {
  toast: ToastMessage;
}

export default function Toast({ toast }: ToastProps) {
  const dispatch = useAppDispatch();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => dispatch(removeToast(toast.id)), 300);
    }, toast.duration || 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [toast.id, toast.duration, dispatch]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => dispatch(removeToast(toast.id)), 300);
  };

  const animationClass = isExiting 
    ? 'animate-toast-exit' 
    : 'animate-toast-enter';

  return (
    <div
      className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden flex ${animationClass}`}
    >
      <div className="p-4 flex items-center">
        {icons[toast.type]}
      </div>
      <div className="flex-1 p-4">
        <p className="text-sm font-medium text-gray-900">{toast.message}</p>
      </div>
      <div className="flex border-l border-gray-200">
        <button
          onClick={handleDismiss}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
         <X size={20} />
        </button>
      </div>
    </div>
  );
} 