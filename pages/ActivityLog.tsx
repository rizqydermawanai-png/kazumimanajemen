// pages/ActivityLog.tsx
import React from 'react';
import { getUsernameById, formatDate } from '../lib/utils';
import { Activity } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const ActivityLogPage = () => {
    const { state } = useAppContext();
    const { activityLog, users } = state;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Log Aktivitas Kerja</h1>
            <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
                <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm min-w-[700px]">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="p-4 font-semibold text-slate-600">Waktu</th>
                            <th className="p-4 font-semibold text-slate-600">Tipe</th>
                            <th className="p-4 font-semibold text-slate-600">Deskripsi</th>
                            <th className="p-4 font-semibold text-slate-600">Oleh</th>
                            <th className="p-4 font-semibold text-slate-600">ID Terkait</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activityLog.map(log => (
                            <tr key={log.id} className="border-b last:border-b-0 hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 text-slate-500 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                                <td className="p-4"><span className="bg-slate-200 text-slate-700 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap">{log.type}</span></td>
                                <td className="p-4 text-slate-800">{log.description}</td>
                                <td className="p-4 text-slate-600 whitespace-nowrap">{getUsernameById(log.userId, users)}</td>
                                <td className="p-4 text-slate-500 font-mono text-xs">{log.relatedId || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
                 {activityLog.length === 0 && (
                    <div className="text-center p-12 text-slate-500">
                        <Activity className="mx-auto mb-2" />
                        <p>Tidak ada aktivitas yang tercatat.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
