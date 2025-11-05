// components/WorkClock.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Sun, Moon, Coffee, X, AlertTriangle, CheckCircle, ThumbsUp } from 'lucide-react';
import type { AttendanceRecord } from '../types';

interface WorkClockProps {
    todaysAttendance: AttendanceRecord | null;
}

const formatTime = (date: Date) => date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const formatCountdown = (ms: number) => {
    if (ms < 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};

// Analog Clock Hand Component
const AnalogHand = ({ rotation, length, width, color }: { rotation: number; length: string; width: string; color: string }) => (
    <div
        className="absolute bottom-1/2 left-1/2"
        style={{
            height: length,
            width: width,
            backgroundColor: color,
            transformOrigin: 'bottom center',
            transform: `translateX(-50%) rotate(${rotation}deg)`,
            borderRadius: '9999px',
        }}
    />
);

const getPunctualityInfo = (status: 'late' | 'on_time' | 'early') => {
    switch (status) {
        case 'late':
            return { Icon: AlertTriangle, color: 'text-red-500' };
        case 'on_time':
            return { Icon: CheckCircle, color: 'text-green-500' };
        case 'early':
            return { Icon: ThumbsUp, color: 'text-blue-500' };
        default:
            return { Icon: Clock, color: 'text-slate-500' };
    }
};


export const WorkClock = ({ todaysAttendance }: WorkClockProps) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [clockStyle, setClockStyle] = useState<'modern' | 'classic'>('modern');

    useEffect(() => {
        const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);
    
    useEffect(() => {
        if (isPopupOpen) {
            const timeoutId = setTimeout(() => {
                setIsPopupOpen(false);
            }, 30000); // Auto close after 30 seconds
            return () => clearTimeout(timeoutId);
        }
    }, [isPopupOpen]);

    const workDetails = useMemo(() => {
        if (!todaysAttendance?.clockInTimestamp) return null;

        const clockIn = new Date(todaysAttendance.clockInTimestamp);
        const todayStr = clockIn.toISOString().split('T')[0];

        const officialStart = new Date(`${todayStr}T08:00:00`);
        const officialEnd = new Date(`${todayStr}T17:00:00`); // 8 work hours + 1 break hour
        const breakStart = new Date(`${todayStr}T12:00:00`);
        const breakEnd = new Date(`${todayStr}T13:00:00`);

        const isLate = clockIn > officialStart;
        const expectedEndTime = isLate ? new Date(clockIn.getTime() + 9 * 60 * 60 * 1000) : officialEnd;

        const remainingMs = expectedEndTime.getTime() - currentTime.getTime();
        const isBreakTime = currentTime >= breakStart && currentTime < breakEnd;

        const lateMinutes = (clockIn.getTime() - officialStart.getTime()) / (1000 * 60);
        let punctualityStatus: 'late' | 'on_time' | 'early';
        let punctualityText: string;

        if (lateMinutes > 5) {
            punctualityStatus = 'late';
            punctualityText = `Terlambat ${Math.round(lateMinutes)}m`;
        } else if (lateMinutes < -5) {
            punctualityStatus = 'early';
            punctualityText = `Lebih Awal ${Math.round(Math.abs(lateMinutes))}m`;
        } else {
            punctualityStatus = 'on_time';
            punctualityText = 'Tepat Waktu';
        }

        return {
            clockIn,
            expectedEndTime,
            remainingMs,
            isBreakTime,
            punctualityStatus,
            punctualityText
        };
    }, [currentTime, todaysAttendance]);

    if (!workDetails) return null;

    const { remainingMs, isBreakTime, expectedEndTime, punctualityStatus, punctualityText, clockIn } = workDetails;

    // Analog clock calculations
    const secondsDeg = (currentTime.getSeconds() / 60) * 360;
    const minutesDeg = (currentTime.getMinutes() / 60) * 360 + (currentTime.getSeconds() / 60) * 6;
    const hoursDeg = (currentTime.getHours() / 12) * 360 + (currentTime.getMinutes() / 60) * 30;

    const { Icon: PunctualityIcon, color: punctualityColor } = getPunctualityInfo(punctualityStatus);

    return (
        <>
            {/* Small Widget */}
            <motion.div
                layoutId="work-clock-widget"
                onClick={() => setIsPopupOpen(true)}
                className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg cursor-pointer p-3 flex items-center gap-3 text-slate-800 border"
                whileHover={{ scale: 1.05 }}
            >
                <Clock size={20} className="text-indigo-600" />
                <div className="flex flex-col text-right">
                    <span className="font-mono font-bold text-sm">{formatTime(currentTime)}</span>
                    <span className={`font-mono text-xs ${isBreakTime ? 'text-green-600 animate-pulse' : 'text-slate-500'}`}>
                        {isBreakTime ? 'Waktu Istirahat' : `Sisa: ${formatCountdown(remainingMs)}`}
                    </span>
                </div>
            </motion.div>
            
            {/* Popup Modal */}
            <AnimatePresence>
                {isPopupOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            layoutId="work-clock-widget"
                            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 relative flex flex-col"
                        >
                            <button onClick={() => setIsPopupOpen(false)} className="absolute top-3 right-3 p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                                <X size={20} />
                            </button>

                            <div className="flex justify-center mb-4 bg-slate-100 p-1 rounded-lg">
                                <button onClick={() => setClockStyle('modern')} className={`px-4 py-1 text-sm font-semibold rounded-md flex-1 transition ${clockStyle === 'modern' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600'}`}>Modern</button>
                                <button onClick={() => setClockStyle('classic')} className={`px-4 py-1 text-sm font-semibold rounded-md flex-1 transition ${clockStyle === 'classic' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600'}`}>Klasik</button>
                            </div>

                            <div className="h-48 w-48 mx-auto my-4 flex items-center justify-center">
                                {clockStyle === 'modern' ? (
                                    <div className="text-center">
                                        <p className="font-mono text-5xl font-bold text-slate-800">{formatTime(currentTime)}</p>
                                    </div>
                                ) : (
                                    <div className="w-full h-full rounded-full border-4 border-slate-700 bg-slate-50 relative">
                                        {Array.from({ length: 12 }).map((_, i) => (
                                            <div key={i} className="absolute w-full h-full flex justify-center" style={{ transform: `rotate(${i * 30}deg)` }}>
                                                <div className={`absolute top-0 bg-slate-700 ${i % 3 === 0 ? 'w-1 h-3' : 'w-0.5 h-2'}`} />
                                            </div>
                                        ))}
                                        <AnalogHand rotation={hoursDeg} length="25%" width="4px" color="#334155" />
                                        <AnalogHand rotation={minutesDeg} length="35%" width="3px" color="#475569" />
                                        <AnalogHand rotation={secondsDeg} length="40%" width="2px" color="#ef4444" />
                                        <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-slate-800 rounded-full transform -translate-x-1/2 -translate-y-1/2 border-2 border-white"></div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="text-center mb-4">
                                <p className="font-semibold text-slate-500 text-sm">
                                     {isBreakTime ? 'Selamat Menikmati Waktu Istirahat' : 'Sisa Waktu Kerja'}
                                </p>
                                {isBreakTime ? (
                                    <motion.div
                                        className="flex flex-col items-center text-green-600 p-2 rounded-lg"
                                        animate={{ 
                                            scale: [1, 1.03, 1],
                                            boxShadow: ["0 0 0px rgba(34, 197, 94, 0)", "0 0 15px rgba(34, 197, 94, 0.7)", "0 0 0px rgba(34, 197, 94, 0)"]
                                        }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <Coffee size={24} className="mb-1"/>
                                        <p className="font-mono text-3xl font-bold">ISTIRAHAT</p>
                                    </motion.div>
                                ) : (
                                    <p className="font-mono text-3xl font-bold text-indigo-600">
                                        {formatCountdown(remainingMs)}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2 text-sm text-center bg-slate-50 p-3 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-slate-600 flex items-center gap-1"><Sun size={14}/> Jam Masuk Anda</span>
                                    <div className={`flex items-center gap-1 font-bold ${punctualityColor}`}>
                                        <PunctualityIcon size={14} />
                                        <span>{clockIn.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                                <p className="text-right text-xs -mt-1 font-semibold text-slate-500">{punctualityText}</p>
                                
                                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                                    <span className="font-semibold text-slate-600 flex items-center gap-1"><Moon size={14}/> Estimasi Jam Pulang</span>
                                    <span className="font-bold">{expectedEndTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="flex justify-between items-center text-green-700 pt-1 border-t border-slate-200">
                                    <span className="font-semibold flex items-center gap-1"><Coffee size={14}/> Waktu Istirahat</span>
                                    <span>12:00 - 13:00</span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};