
import React from 'react';

type CustomInputProps = React.ComponentPropsWithoutRef<'input'> & {
    label?: string;
};

export const CustomInput = React.forwardRef<HTMLInputElement, CustomInputProps>(({ label, className, ...props }, ref) => (
    <div>
        {label && <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>}
        <input ref={ref} className={`w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out text-slate-900 placeholder:text-slate-400 ${className}`} {...props} />
    </div>
));