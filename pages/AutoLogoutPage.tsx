// pages/AutoLogoutPage.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { LogOut, CheckCircle } from 'lucide-react';

interface AutoLogoutPageProps {
    onLogout: () => void;
}

export const AutoLogoutPage = ({ onLogout }: AutoLogoutPageProps) => {
    const COUNTDOWN_SECONDS = 10;
    const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

    useEffect(() => {
        // When the countdown hits zero, trigger the logout function.
        if (countdown <= 0) {
            onLogout();
            return;
        }

        // Set a timer to decrement the countdown every second.
        const timerId = setTimeout(() => {
            setCountdown(prevCountdown => prevCountdown - 1);
        }, 1000);

        // Clean up the timer when the component unmounts or the effect re-runs.
        return () => clearTimeout(timerId);
    }, [countdown, onLogout]);

    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    // Calculate progress from 1 (full) down to 0 (empty).
    const progress = countdown / COUNTDOWN_SECONDS;

    return (
        <div className="flex h-screen bg-slate-100 items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border"
            >
                <div className="flex flex-col items-center justify-center p-8 min-h-[500px]">
                    <h1 className="text-4xl font-extrabold text-indigo-600 tracking-wider mb-8">KAZUMI</h1>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                        className="mb-4"
                    >
                        <CheckCircle size={56} className="text-green-500" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-slate-800">Konfirmasi Diterima</h2>
                    <p className="text-slate-600 mt-2 mb-8 max-w-sm text-center">
                        Terima kasih. Akun Anda telah dinonaktifkan. Anda akan keluar secara otomatis.
                    </p>
                    
                    <div className="relative w-36 h-36">
                        <svg className="absolute w-full h-full" viewBox="0 0 140 140">
                            <circle
                                cx="70" cy="70" r={radius}
                                stroke="#e2e8f0" strokeWidth="8" fill="transparent"
                            />
                            <motion.circle
                                cx="70" cy="70" r={radius}
                                stroke="#4f46e5" strokeWidth="8" fill="transparent"
                                strokeLinecap="round" transform="rotate(-90 70 70)"
                                strokeDasharray={circumference}
                                // The circle animates smoothly from full to empty as the countdown progresses.
                                animate={{ strokeDashoffset: circumference * (1 - progress) }}
                                transition={{ duration: 1, ease: 'linear' }}
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-5xl font-bold text-indigo-600">
                            {/* Display the countdown, but don't show zero before logging out. */}
                            {countdown > 0 ? countdown : ''}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-4">Keluar otomatis dalam...</p>

                    <Button onClick={onLogout} variant="outline" className="mt-8 w-full max-w-xs mx-auto">
                        <LogOut size={16} className="mr-2" /> Logout Sekarang
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};