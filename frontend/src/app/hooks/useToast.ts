import { useAppDispatch } from '@/lib/redux/hooks';
import { addToast, ToastType } from '@/lib/redux/toastSlice';

export const useToast = () => {
  const dispatch = useAppDispatch();

  const toast = (message: string, options?: { type?: ToastType; duration?: number }) => {
    dispatch(
      addToast({
        message,
        type: options?.type || 'info',
        duration: options?.duration,
      })
    );
  };

  return toast;
};
