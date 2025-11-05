import React from 'react';

// FIX: Define a reusable props type that extends standard select element props for better type safety.
// This resolves issues where TypeScript couldn't correctly infer props like `children`.
type CustomSelectProps = {
    label?: string;
    children: React.ReactNode;
} & React.ComponentPropsWithoutRef<'select'>

export const CustomSelect = ({ label, children, className, ...props }: CustomSelectProps) => (
    <div>
        {label && <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>}
        <select className={`w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 ${className}`} {...props}>
            {children}
        </select>
    </div>
);