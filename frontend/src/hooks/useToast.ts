import { useAppDispatch } from "@/lib/redux/hooks";
import { addToast, ToastType } from "@/lib/redux/toastSlice";

/**
 * A hook for dispatching toast notifications to the Redux store.
 * @returns A function that can be called to show a toast.
 *
 * @example
 * const toast = useToast();
 * toast('Hello world!', { type: 'success' });
 */
export const useToast = () => {
    const dispatch = useAppDispatch();

    const toast = (
        message: string,
        options?: { type?: ToastType; duration?: number }
    ) => {
        dispatch(
            addToast({
                message,
                type: options?.type || "info",
                duration: options?.duration,
            })
        );
    };

    return toast;
};
