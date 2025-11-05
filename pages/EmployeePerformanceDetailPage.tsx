// pages/EmployeePerformanceDetailPage.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import type { PointLogEntry, PerformanceScore, Sanction, PerformanceReview } from '../types';
import { TrendingUp, ArrowUp, ArrowDown, History, Shield, Clock, BrainCircuit, ChevronLeft, Star, UserX } from 'lucide-react';
import { formatDate, getUsernameById, formatDepartment } from '../lib/utils';
import { useAppContext } from '../context/AppContext';

const ScoreGauge = ({ score }: { score: number }) => {
    const getScoreColor = (s: number) => {
        if (s >= 80) return { main: '#22c55e', bg: '#dcfce7' }; // green
        if (s >= 60) return { main: '#3b82f6', bg: '#dbeafe' }; // blue
        if (s >= 40) return { main: '#f59e0b', bg: '#fef3c7' }; // amber
        return { main: '#ef4444', bg: '#fee2e2' }; // red
    };

    const color = getScoreColor(score);
    const circumference = 2 * Math.PI * 54;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="relative w-48 h-48">
            <svg className="w-full h-full" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke={color.bg} strokeWidth="12" />
                <motion.circle
                    cx="60" cy="60" r="54" fill="none"
                    stroke={color.main} strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
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
    const maxScore = 100;
    const percentage = Math.min(100, (score / maxScore) * 100);

    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                    <Icon style={{ color }} size={18} />
                    <span className="text-sm font-semibold text-slate-700">{label}</span>
                </div>
                <span className="text-sm font-bold" style={{ color }}>{score} Poin</span>
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

interface EmployeePerformanceDetailPageProps {
    userId: string;
    onBack: () => void;
}

export const EmployeePerformanceDetailPage = ({ userId, onBack }: EmployeePerformanceDetailPageProps) => {
    const { state } = useAppContext();
    const { users } = state;
    const employee = users.find(u => u.uid === userId);

    if (!employee) {
        return (
            <div className="text-center p-12">
                <UserX size={48} className="mx-auto text-red-500 mb-4" />
                <h2 className="text-xl font-bold">Pegawai Tidak Ditemukan</h2>
                <p className="text-slate-500">Data pegawai yang Anda cari tidak ada.</p>
                <Button onClick={onBack} className="mt-4">Kembali</Button>
            </div>
        );
    }
    
    const score: PerformanceScore = employee.performanceScore || {
        totalPoints: 0,
        breakdown: { punctuality: 0, discipline: 0, productivity: 0, initiative: 0 },
        lastUpdated: new Date().toISOString()
    };
    const history: PointLogEntry[] = employee.pointHistory || [];
    const sanctions: Sanction[] = employee.sanctions || [];
    const reviews: PerformanceReview[] = employee.performanceReviews || [];
    
    const breakdownItems = [
        { label: 'Ketepatan Waktu', score: score.breakdown.punctuality, icon: Clock, color: '#3b82f6' },
        { label: 'Disiplin', score: score.breakdown.discipline, icon: Shield, color: '#8b5cf6' },
        { label: 'Produktivitas', score: score.breakdown.productivity, icon: TrendingUp, color: '#10b981' },
        { label: 'Inisiatif', score: score.breakdown.initiative, icon: BrainCircuit, color: '#f59e0b' },
    ];
    
    const getSanctionBadgeColor = (type: Sanction['type']) => {
        switch (type) {
            case 'warning': return 'bg-yellow-100 text-yellow-800';
            case 'suspension': return 'bg-orange-100 text-orange-800';
            case 'termination': return 'bg-red-200 text-red-900 font-bold';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={onBack} className="!p-2 h-auto">
                    <ChevronLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Detail Kinerja: {employee.fullName}</h1>
                    <p className="text-slate-500">{formatDepartment(employee.department)}</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-6">
                    <Card className="flex flex-col items-center justify-center p-6">
                        <h2 className="text-lg font-bold text-slate-700 mb-4">Total Poin Kinerja</h2>
                        <ScoreGauge score={score.totalPoints} />
                    </Card>
                    <Card className="p-6">
                        <h2 className="text-lg font-bold text-slate-700 mb-4">Rincian Poin</h2>
                        <div className="space-y-4">
                            {breakdownItems.map(item => <BreakdownBar key={item.label} label={item.label} score={item.score} icon={item.icon} color={item.color} />)}
                        </div>
                    </Card>
                </div>

                <div className="md:col-span-2 space-y-6">
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

                    <Card>
                        <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2"><Shield size={20} className="text-red-500" /> Riwayat Sanksi</h2>
                        <div className="max-h-60 overflow-y-auto pr-2 space-y-3">
                            {sanctions.length > 0 ? (
                                sanctions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(s => (
                                    <div key={s.id} className="p-3 border rounded-lg">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getSanctionBadgeColor(s.type)}`}>{s.type.charAt(0).toUpperCase() + s.type.slice(1)}</span>
                                            <p className="text-xs text-slate-500">{formatDate(s.date)}</p>
                                        </div>
                                        {s.checklistItems.length > 0 && (
                                            <ul className="list-disc list-inside text-sm text-slate-600 mt-1">
                                                {s.checklistItems.map(item => <li key={item}>{item}</li>)}
                                            </ul>
                                        )}
                                        <p className="text-sm text-slate-700 mt-1">{s.reason}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-center text-slate-500 py-4">Tidak ada riwayat sanksi.</p>
                            )}
                        </div>
                    </Card>

                    <Card>
                         <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2"><Star size={20} className="text-yellow-500"/> Riwayat Penilaian</h2>
                         <div className="max-h-60 overflow-y-auto pr-2 space-y-3">
                             {reviews.length > 0 ? (
                                reviews.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(review => (
                                    <div key={review.id} className="p-3 border rounded-lg">
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center">
                                                {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-slate-300'}`} />)}
                                            </div>
                                            <p className="text-xs text-slate-500">{formatDate(review.date)} oleh {review.reviewerName}</p>
                                        </div>
                                        <p className="text-sm text-slate-700">{review.comment}</p>
                                    </div>
                                ))
                             ) : (
                                <p className="text-sm text-center text-slate-500 py-4">Belum ada riwayat penilaian.</p>
                             )}
                         </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
