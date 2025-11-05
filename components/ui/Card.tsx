
// components/ui/Card.tsx
import React from 'react';
import { motion } from 'framer-motion';

// FIX: Changed from `interface extends` to a `type` intersection with `ComponentProps`
// to provide more robust type inference for motion.div props, resolving errors with `className` and `children`.
type CardProps = {
    children: React.ReactNode;
} & React.ComponentProps<typeof motion.div>;

export const Card = ({ children, className = '', ...props }: CardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`bg-white p-6 rounded-xl shadow-lg border border-slate-200/80 ${className}`}
            {...props}
        >
            {children}
        </motion.div>
    );
};