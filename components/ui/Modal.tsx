// components/ui/Modal.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

// FIX: Changed props to use React.PropsWithChildren for better type safety and to resolve potential inference issues.
type ModalProps = React.PropsWithChildren<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
}>;

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: -20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                        className="bg-white rounded-xl shadow-lg w-full max-w-lg"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-500">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            {children}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};