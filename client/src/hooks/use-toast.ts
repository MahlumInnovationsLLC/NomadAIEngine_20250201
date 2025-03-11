import { useState, useCallback } from 'react';

type ToastVariant = 'default' | 'destructive' | 'success' | null | undefined;

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

// Create a singleton toast instance for direct imports
let globalToasts: Toast[] = [];
let setGlobalToasts: (toasts: Toast[]) => void = () => {};

export const toast = ({ title, description, variant = 'default', duration = 5000 }: ToastOptions) => {
  const id = Math.random().toString(36).slice(2, 9);
  
  setGlobalToasts([
    ...globalToasts,
    {
      id,
      title,
      description,
      variant,
    },
  ]);

  setTimeout(() => {
    setGlobalToasts(globalToasts.filter((toast) => toast.id !== id));
  }, duration);

  return id;
};

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Set global reference
  globalToasts = toasts;
  setGlobalToasts = setToasts;

  const toastFunction = useCallback(
    ({ title, description, variant = 'default', duration = 5000 }: ToastOptions) => {
      const id = Math.random().toString(36).slice(2, 9);
      
      setToasts((prevToasts) => [
        ...prevToasts,
        {
          id,
          title,
          description,
          variant,
        },
      ]);

      setTimeout(() => {
        setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
      }, duration);

      return id;
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return {
    toast: toastFunction,
    dismiss,
    toasts,
  };
}