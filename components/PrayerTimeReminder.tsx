// components/PrayerTimeReminder.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { getPrayerTimes } from '../lib/prayerTimes';
import { useToast } from '../hooks/useToast';

const formatCountdown = (ms: number) => {
    if (ms < 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};

export const PrayerTimeReminder = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const { addToast } = useToast();
    const notifiedPrayers = React.useRef<Set<string>>(new Set());

    useEffect(() => {
        const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const prayerTimes = useMemo(() => getPrayerTimes(currentTime), [currentTime.getDate()]);

    const nextPrayerInfo = useMemo(() => {
        const prayerSchedule = [
            { name: 'Subuh', time: prayerTimes.subuh },
            { name: 'Dzuhur', time: prayerTimes.dzuhur },
            { name: 'Ashar', time: prayerTimes.ashar },
            { name: 'Maghrib', time: prayerTimes.maghrib },
            { name: 'Isya', time: prayerTimes.isya },
        ];
        
        // Reset notification tracker for a new day
        if(currentTime.getHours() === 0 && currentTime.getMinutes() === 0 && currentTime.getSeconds() === 0) {
            notifiedPrayers.current.clear();
        }

        for (const prayer of prayerSchedule) {
            const timeDiff = prayer.time.getTime() - currentTime.getTime();
            if (timeDiff >= 0) {
                 // Trigger notification if it's prayer time and not yet notified
                 if (timeDiff < 1000 && !notifiedPrayers.current.has(prayer.name)) {
                    addToast({
                        title: `Waktu Sholat ${prayer.name} Telah Tiba`,
                        message: 'Mari sejenak tunaikan kewajiban.',
                        type: 'info',
                        duration: 10000,
                    });
                    notifiedPrayers.current.add(prayer.name);
                }
                return { name: prayer.name, time: prayer.time };
            }
        }
        
        // If all prayers for today are done, show Subuh for the next day
        const tomorrow = new Date(currentTime);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextDayPrayers = getPrayerTimes(tomorrow);
        return { name: 'Subuh', time: nextDayPrayers.subuh };

    }, [currentTime, prayerTimes, addToast]);

    const timeUntilNextPrayer = nextPrayerInfo.time.getTime() - currentTime.getTime();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg p-3 flex items-center gap-3 text-slate-800 border"
        >
            <Bell size={20} className="text-yellow-500" />
            <div className="flex flex-col text-right">
                <span className="font-semibold text-sm">Sholat {nextPrayerInfo.name}</span>
                <span className="font-mono text-xs text-slate-500">
                    {formatCountdown(timeUntilNextPrayer)}
                </span>
            </div>
        </motion.div>
    );
};