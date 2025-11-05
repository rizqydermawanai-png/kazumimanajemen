// pages/ClockOutPage.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { LogOut, Home, Sparkles } from 'lucide-react';

interface ClockOutPageProps {
    type: 'on_time' | 'overtime';
    onFinish: () => void;
}

const contentData = {
    on_time: {
        icon: <Home size={56} className="text-green-500" />,
        title: "Kerja Hebat, Tepat Waktu!",
        greeting: "بِسْمِكَ اللّهُمَّ أَحْيَا وَأَمُوتُ",
        translation: "(Dengan nama-Mu ya Allah aku hidup dan aku mati)",
        motivation: "Selamat beristirahat, semoga lelahmu menjadi berkah. Nikmati waktu bersama keluarga dengan tenang.",
        imageClass: 'bg-[url(https://images.unsplash.com/photo-1528824639339-178696116a44?q=80&w=1964&auto=format&fit=crop)]',
    },
    overtime: {
        icon: <Sparkles size={56} className="text-yellow-400" />,
        title: "Dedikasi Luar Biasa!",
        greeting: "فِي أَمَانِ الله",
        translation: "(Semoga selalu dalam lindungan Allah)",
        motivation: "Terima kasih atas kerja keras dan waktu ekstra yang kamu berikan. Hati-hati di jalan pulang dan pulihkan energimu.",
        imageClass: 'bg-[url(https://images.unsplash.com/photo-1531306734794-8a16b9b3699b?q=80&w=1974&auto=format&fit=crop)]',
    }
};

export const ClockOutPage = ({ type, onFinish }: ClockOutPageProps) => {
    const COUNTDOWN_SECONDS = 10;
    const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
    const selectedContent = contentData[type];

    useEffect(() => {
        if (countdown <= 0) {
            onFinish();
            return;
        }
        const timerId = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timerId);
    }, [countdown, onFinish]);

    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const progress = countdown / COUNTDOWN_SECONDS;

    return (
        <div className={`relative flex h-screen items-center justify-center p-4 bg-cover bg-center ${selectedContent.imageClass}`}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20 text-white"
            >
                <div className="flex flex-col items-center justify-center p-8 text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                        className="mb-4"
                    >
                        {selectedContent.icon}
                    </motion.div>
                    <h1 className="text-3xl font-bold">{selectedContent.title}</h1>
                    <p className="text-lg mt-4 mb-2 font-serif tracking-wider">{selectedContent.greeting}</p>
                    <p className="text-xs text-slate-300 italic mb-6">{selectedContent.translation}</p>
                    <p className="text-slate-200 mb-8">{selectedContent.motivation}</p>
                    
                    <div className="relative w-24 h-24">
                        <svg className="absolute w-full h-full" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r={radius} stroke="rgba(255,255,255,0.2)" strokeWidth="6" fill="transparent" />
                            <motion.circle
                                cx="50" cy="50" r={radius}
                                stroke="#ffffff" strokeWidth="6" fill="transparent"
                                strokeLinecap="round" transform="rotate(-90 50 50)"
                                strokeDasharray={circumference}
                                animate={{ strokeDashoffset: circumference * (1 - progress) }}
                                transition={{ duration: 1, ease: 'linear' }}
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold">
                            {countdown > 0 ? countdown : ''}
                        </span>
                    </div>

                    <Button onClick={onFinish} variant="outline" className="bg-transparent text-white border-white/50 hover:bg-white/20 mt-8 w-full max-w-xs mx-auto">
                        <LogOut size={16} className="mr-2" /> Logout Sekarang
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};
