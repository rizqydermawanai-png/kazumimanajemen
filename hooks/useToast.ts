// hooks/useToast.ts
// CATATAN: Berkas ini idealnya diganti nama menjadi useToast.tsx untuk menggunakan sintaks JSX.
import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer, ToastProps } from '../components/ui/Toast';
import { ToastNotification } from '../types';

interface ToastContextType {
    addToast: (toast: Omit<ToastNotification, 'id' | 'onDismiss'>) => void;
    removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }: React.PropsWithChildren<{}>) => {
    const [toasts, setToasts] = useState<ToastProps[]>([]);

    const removeToast = useCallback((id: number) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []);

    const addToast = useCallback((toast: Omit<ToastNotification, 'id' | 'onDismiss'>) => {
        const id = Date.now();
        const onDismiss = () => removeToast(id);
        setToasts(prevToasts => [...prevToasts, { ...toast, id, onDismiss }]);
    }, [removeToast]);

    // FIX: Replaced JSX syntax with React.createElement to be compatible with .ts file extension.
    // This resolves parsing errors that caused the component's return type to be inferred incorrectly.
    // FIX: Wrapped multiple children in a single React.Fragment to resolve potential type inference issues with React.createElement in a .ts file.
    return React.createElement(
      ToastContext.Provider,
      { value: { addToast, removeToast } },
      React.createElement(
        React.Fragment,
        null,
        children,
        React.createElement(ToastContainer, { toasts: toasts })
      )
    );
};