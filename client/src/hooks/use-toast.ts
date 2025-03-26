import { useState, useCallback } from 'react';

type ToastVariant = 'default' | 'destructive' | 'success' | null | undefined;

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastOptions {
  id?: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

// Create a singleton toast instance for direct imports
let globalToasts: Toast[] = [];
let setGlobalToasts: (toasts: Toast[]) => void = () => {};

export const toast = ({ id: providedId, title, description, variant = 'default', duration = 5000 }: ToastOptions) => {
  const id = providedId || Math.random().toString(36).slice(2, 9);
  
  // If an existing toast with this ID exists, remove it first
  if (providedId) {
    const existingIndex = globalToasts.findIndex(t => t.id === providedId);
    if (existingIndex >= 0) {
      setGlobalToasts(globalToasts.filter(t => t.id !== providedId));
    }
  }
  
  // Add the new toast (or replace existing one)
  setGlobalToasts([
    ...globalToasts,
    {
      id,
      title,
      description,
      variant,
    },
  ]);

  // Only set a timeout if duration > 0
  if (duration > 0) {
    setTimeout(() => {
      setGlobalToasts(globalToasts.filter((toast) => toast.id !== id));
    }, duration);
  }

  return { id };
};

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Set global reference
  globalToasts = toasts;
  setGlobalToasts = setToasts;

  const toastFunction = useCallback(
    ({ id: providedId, title, description, variant = 'default', duration = 5000 }: ToastOptions) => {
      const id = providedId || Math.random().toString(36).slice(2, 9);
      
      // If an existing toast with this ID exists, remove it first
      if (providedId) {
        setToasts((prevToasts) => prevToasts.filter(t => t.id !== providedId));
      }
      
      // Add the new toast (or replace existing one)
      setToasts((prevToasts) => [
        ...prevToasts,
        {
          id,
          title,
          description,
          variant,
        },
      ]);

      // Only set a timeout if duration > 0
      if (duration > 0) {
        setTimeout(() => {
          setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
        }, duration);
      }

      return { id };
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