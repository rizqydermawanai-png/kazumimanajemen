// components/ui/Toast.tsx
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { ToastNotification } from '../../types';

export type ToastProps = ToastNotification;

const icons = {
    success: <CheckCircle className="text-green-500" size={24} />,
    error: <AlertCircle className="text-red-500" size={24} />,
    warning: <AlertTriangle className="text-yellow-500" size={24}/>,
    info: <Info className="text-blue-500" size={24}/>,
};

// FIX: Changed component to use React.FC<ToastProps> to correctly type it as a React component,
// resolving errors where the 'key' prop was not recognized when mapping over toasts.
const Toast: React.FC<ToastProps> = ({ id, title, message, type = 'info', duration = 4000, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss();
        }, duration);

        return () => {
            clearTimeout(timer);
        };
    }, [duration, onDismiss]);
    
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 150, damping: 20 }}
            className="flex items-start w-full max-w-sm p-4 bg-white rounded-xl shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5"
        >
            <div className="flex-shrink-0 pt-0.5">{icons[type]}</div>
            <div className="flex-1 w-0 ml-3">
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                {message && <p className="mt-1 text-sm text-gray-600">{message}</p>}
            </div>
            <div className="flex flex-shrink-0 ml-4">
                <button
                    onClick={onDismiss}
                    className="inline-flex text-gray-400 bg-white rounded-md hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    <span className="sr-only">Close</span>
                    <X className="w-5 h-5" />
                </button>
            </div>
        </motion.div>
    );
};

export const ToastContainer = ({ toasts }: { toasts: ToastProps[] }) => {
    return (
        <div id="toast-container" className="fixed inset-0 z-[10001] flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start">
            <div className="flex flex-col items-center w-full space-y-4 sm:items-end">
                <AnimatePresence>
                    {/* FIX: Pass props explicitly to avoid linter errors with spreading props alongside the 'key' prop. */}
                    {toasts.map((toast) => (
                        <Toast 
                            key={toast.id}
                            id={toast.id}
                            title={toast.title}
                            message={toast.message}
                            type={toast.type}
                            duration={toast.duration}
                            onDismiss={toast.onDismiss}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};