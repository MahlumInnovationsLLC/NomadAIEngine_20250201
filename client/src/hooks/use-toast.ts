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

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
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
    toast,
    dismiss,
    toasts,
  };
}