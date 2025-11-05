// pages/PerformanceDashboardPage.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import type { PointLogEntry, PerformanceScore } from '../types';
import { TrendingUp, ArrowUp, ArrowDown, History, Shield, Clock, BrainCircuit } from 'lucide-react';
import { formatDate, getUsernameById } from '../lib/utils';
import { useAppContext } from '../context/AppContext';


const ScoreGauge = ({ score }: { score: number }) => {
    const getScoreColor = (s: number) => {
        if (s >= 80) return { main: '#22c55e', bg: '#dcfce7' }; // green
        if (s >= 60) return { main: '#3b82f6', bg: '#dbeafe' }; // blue
        if (s >= 40) return { main: '#f59e0b', bg: '#fef3c7' }; // amber
        return { main: '#ef4444', bg: '#fee2e2' }; // red
    };

    const color = getScoreColor(score);
    const circumference = 2 * Math.PI * 54; // 2 * pi * radius
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="relative w-48 h-48">
            <svg className="w-full h-full" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke={color.bg} strokeWidth="12" />
                <motion.circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke={color.main}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 60 60)"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold" style={{ color: color.main }}>{Math.round(score)}</span>
                <span className="text-sm font-semibold text-slate-500">Poin</span>
            </div>
        </div>
    );
};

type BreakdownBarProps = {
    label: string;
    score: number;
    icon: React.ElementType;
    color: string;
}

const BreakdownBar: React.FC<BreakdownBarProps> = ({ label, score, icon: Icon, color }) => {
    const maxScore = 100; // Each category contributes a portion
    const percentage = (score / maxScore) * 100;

    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                    <Icon className={color} size={18} />
                    <span className="text-sm font-semibold text-slate-700">{label}</span>
                </div>
                <span className={`text-sm font-bold ${color}`}>{score} Poin</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
                <motion.div
                    className="rounded-full h-2.5"
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
            </div>
        </div>
    );
};


export const PerformanceDashboardPage = () => {
    const { state } = useAppContext();
    const { currentUser, users } = state;
    
    if (!currentUser) return null;

    // Get score and history directly from the currentUser prop, which is now always up-to-date.
    const score: PerformanceScore = currentUser.performanceScore || {
        totalPoints: 0,
        breakdown: { punctuality: 0, discipline: 0, productivity: 0, initiative: 0 },
        lastUpdated: new Date().toISOString()
    };
    const history: PointLogEntry[] = currentUser.pointHistory || [];
    
    const breakdownItems = [
        { label: 'Ketepatan Waktu', score: score.breakdown.punctuality, icon: Clock, color: '#3b82f6' },
        { label: 'Disiplin', score: score.breakdown.discipline, icon: Shield, color: '#8b5cf6' },
        { label: 'Produktivitas', score: score.breakdown.productivity, icon: TrendingUp, color: '#10b981' },
        { label: 'Inisiatif', score: score.breakdown.initiative, icon: BrainCircuit, color: '#f59e0b' },
    ];
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Dasbor Kinerja Saya</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1 flex flex-col items-center justify-center p-6">
                    <h2 className="text-lg font-bold text-slate-700 mb-4">Total Poin Kinerja</h2>
                    <ScoreGauge score={score.totalPoints} />
                </Card>
                <Card className="md:col-span-2 p-6">
                    <h2 className="text-lg font-bold text-slate-700 mb-4">Rincian Poin</h2>
                    <div className="space-y-4">
                       {breakdownItems.map(item => <BreakdownBar key={item.label} label={item.label} score={item.score} icon={item.icon} color={item.color} />)}
                    </div>
                </Card>
            </div>
            
            <Card>
                <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2"><History size={20}/> Riwayat Poin Kinerja</h2>
                <div className="max-h-96 overflow-y-auto pr-2 space-y-2">
                    {history.length > 0 ? history.map(log => (
                        <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                {log.points > 0 ? <ArrowUp size={20} className="text-green-500 flex-shrink-0"/> : <ArrowDown size={20} className="text-red-500 flex-shrink-0"/>}
                                <div>
                                    <p className="font-semibold text-sm text-slate-800">{log.reason}</p>
                                    <p className="text-xs text-slate-500">
                                        {formatDate(log.date).split(',')[0]} • Kategori: {log.category}
                                        {log.grantedBy && ` • Oleh: ${getUsernameById(log.grantedBy, users)}`}
                                    </p>
                                </div>
                            </div>
                            <span className={`font-bold text-lg ${log.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {log.points > 0 ? '+' : ''}{log.points}
                            </span>
                        </div>
                    )) : (
                        <p className="text-center text-slate-500 py-8">Belum ada riwayat poin.</p>
                    )}
                </div>
            </Card>
        </div>
    );
};
