// pages/AttendancePage.tsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CustomInput } from '../components/ui/CustomInput';
import { CustomSelect } from '../components/ui/CustomSelect';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../hooks/useToast';
import { formatDate } from '../lib/utils';
import type { UserData, AttendanceRecord, PerformanceStatus, AttendanceStatus, PerformanceSignal } from '../types';
import { Eye, Smile, Meh, Frown, User, Calendar, Clock, AlertTriangle, FilterX, TrendingUp, TrendingDown, CheckCircle, XCircle } from 'lucide-react';

interface AttendancePageProps {
    attendanceRecords: AttendanceRecord[];
    setAttendanceRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
    users: UserData[];
    performanceStatuses: PerformanceStatus[];
    addActivity: (type: string, description: string, relatedId?: string) => void;
}

const getStatusBadge = (status: AttendanceStatus) => {
    const styles: Record<AttendanceStatus, string> = {
        'Hadir': 'bg-green-100 text-green-800',
        'Sakit': 'bg-yellow-100 text-yellow-800',
        'Izin': 'bg-blue-100 text-blue-800',
        'Alfa': 'bg-red-100 text-red-800',
    };
    return <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${styles[status]}`}>{status}</span>;
};

const calculateWorkDetails = (record: AttendanceRecord) => {
    const details = {
        duration: '-',
        punctuality: '-',
        overtime: '-',
        score: 0,
        punctualityIcon: <></>,
        overtimeIcon: <></>,
    };

    if (record.status !== 'Hadir') {
        details.score = record.status === 'Alfa' ? 0 : 5;
        return details;
    }
    
    const clockIn = new Date(record.clockInTimestamp);
    const clockOut = record.clockOutTimestamp ? new Date(record.clockOutTimestamp) : null;

    const startWork = new Date(record.date);
    startWork.setHours(8, 0, 0, 0); // 8:00 AM
    const endWork = new Date(record.date);
    endWork.setHours(16, 0, 0, 0); // 4:00 PM

    // Base score for being present
    details.score = 10;

    if (clockOut) {
        const durationMinutes = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60);
        const hours = Math.floor(durationMinutes / 60);
        const minutes = Math.round(durationMinutes % 60);
        details.duration = `${hours}j ${minutes}m`;
    }

    // Punctuality
    const lateMinutes = (clockIn.getTime() - startWork.getTime()) / (1000 * 60);
    if (lateMinutes > 5) { // Toleransi 5 menit
        details.punctuality = `Terlambat ${Math.round(lateMinutes)}m`;
        details.punctualityIcon = <XCircle size={16} className="text-red-500" />;
        details.score -= 2;
    } else {
        details.punctuality = `Tepat Waktu`;
        details.punctualityIcon = <CheckCircle size={16} className="text-green-500" />;
        details.score += 2; // Bonus for early/on-time
    }

    // Overtime
    if (clockOut) {
        const overtimeMinutes = (clockOut.getTime() - endWork.getTime()) / (1000 * 60);
        if (overtimeMinutes > 30) { // Lembur dihitung setelah 30 menit
            const hours = Math.floor(overtimeMinutes / 60);
            const minutes = Math.round(overtimeMinutes % 60);
            details.overtime = `Lembur ${hours > 0 ? `${hours}j ` : ''}${minutes}m`;
            details.overtimeIcon = <TrendingUp size={16} className="text-blue-500" />;
            details.score += Math.floor(overtimeMinutes / 60); // +1 point per hour
        } else {
            const earlyMinutes = (endWork.getTime() - clockOut.getTime()) / (1000 * 60);
            if (earlyMinutes > 5) { // Toleransi 5 menit
                details.overtime = `Pulang Cepat ${Math.round(earlyMinutes)}m`;
                details.overtimeIcon = <TrendingDown size={16} className="text-orange-500" />;
                details.score -= 1;
            } else {
                details.overtime = 'Tepat Waktu';
                details.overtimeIcon = <CheckCircle size={16} className="text-green-500" />;
            }
        }
    }
    
    details.score = Math.max(0, details.score);

    return details;
};

interface AttendanceRecordCardProps {
    record: AttendanceRecord;
    employee: UserData;
    onProofClick: (record: AttendanceRecord) => void;
}

const AttendanceRecordCard: React.FC<AttendanceRecordCardProps> = ({ record, employee, onProofClick }) => {
    const workDetails = calculateWorkDetails(record);
    const clockInTime = record.status === 'Hadir' ? new Date(record.clockInTimestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
    const clockOutTime = record.clockOutTimestamp ? new Date(record.clockOutTimestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
        >
            <Card className="p-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <img src={employee.profilePictureUrl} alt={employee.fullName} className="w-12 h-12 rounded-full object-cover" />
                        <div>
                            <p className="font-bold text-slate-800">{employee.fullName}</p>
                            <p className="text-sm text-slate-500">{employee.department}</p>
                        </div>
                    </div>
                    {getStatusBadge(record.status)}
                </div>
                <div className="border-t my-3"></div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500">JAM MASUK</p>
                        <p className="font-bold text-slate-700">{clockInTime}</p>
                    </div>
                     <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500">JAM PULANG</p>
                        <p className="font-bold text-slate-700">{clockOutTime}</p>
                    </div>
                     <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500">DURASI</p>
                        <p className="font-bold text-slate-700">{workDetails.duration}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500">POIN KINERJA</p>
                        <p className="font-extrabold text-lg text-indigo-600">{workDetails.score}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mt-3 pt-3 border-t">
                    <div className="space-y-1 col-span-2 sm:col-span-1">
                        <p className="text-xs font-semibold text-slate-500">TANGGAL</p>
                        <p className="font-medium text-slate-700">{formatDate(record.date).split(',')[0]}</p>
                    </div>
                     <div className="space-y-1 col-span-2 sm:col-span-1">
                        <p className="text-xs font-semibold text-slate-500">KETEPATAN WAKTU</p>
                        <p className="font-medium text-slate-700 flex items-center gap-1">{workDetails.punctualityIcon} {workDetails.punctuality}</p>
                    </div>
                     <div className="space-y-1 col-span-2 sm:col-span-1">
                        <p className="text-xs font-semibold text-slate-500">LEMBUR</p>
                        <p className="font-medium text-slate-700 flex items-center gap-1">{workDetails.overtimeIcon} {workDetails.overtime}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex justify-end items-center">
                        <Button size="sm" variant="outline" onClick={() => onProofClick(record)}><Eye size={14}/> Bukti</Button>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}

export const AttendancePage = ({ attendanceRecords, setAttendanceRecords, users, performanceStatuses, addActivity }: AttendancePageProps) => {
    const today = new Date().toISOString().split('T')[0];
    const [filters, setFilters] = useState({
        startDate: today,
        endDate: today,
        employeeId: 'all',
        status: 'all' as AttendanceStatus | 'all',
    });
    const [isProofModalOpen, setIsProofModalOpen] = useState<AttendanceRecord | null>(null);
    const { addToast } = useToast();

    const employees = useMemo(() => users.filter(u => ['admin', 'member', 'kepala_gudang', 'kepala_produksi', 'kepala_penjualan', 'penjualan'].includes(u.role)), [users]);

    const filteredRecords = useMemo(() => {
        return attendanceRecords
            .filter(record => {
                const recordDateOnly = record.date.split('T')[0];
                const startDate = filters.startDate ? filters.startDate : null;
                const endDate = filters.endDate ? filters.endDate : null;

                if (startDate && recordDateOnly < startDate) return false;
                if (endDate && recordDateOnly > endDate) return false;
                
                if (filters.employeeId !== 'all' && record.userId !== filters.employeeId) return false;
                if (filters.status !== 'all' && record.status !== filters.status) return false;
                
                return true;
            })
            .sort((a, b) => new Date(b.clockInTimestamp).getTime() - new Date(a.clockInTimestamp).getTime());
    }, [attendanceRecords, filters]);
    
    const isTodaySelected = filters.startDate === today && filters.endDate === today;

    const employeesWithoutAttendanceToday = useMemo(() => {
        if (!isTodaySelected) return [];
        const attendedUserIds = new Set(
            attendanceRecords.filter(r => r.date === today).map(r => r.userId)
        );
        return employees.filter(emp => !attendedUserIds.has(emp.uid));
    }, [employees, attendanceRecords, today, isTodaySelected]);

    const handleFilterChange = (field: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };
    
    const resetFilters = () => {
        setFilters({
            startDate: today,
            endDate: today,
            employeeId: 'all',
            status: 'all',
        });
    };

    const handleMarkAsAlpha = (employeeId: string) => {
        if (window.confirm(`Anda yakin ingin menandai pegawai ini sebagai 'Alfa' untuk hari ini?`)) {
            const newRecord: AttendanceRecord = {
                id: crypto.randomUUID(),
                userId: employeeId,
                date: today,
                status: 'Alfa',
                proof: 'Ditandai oleh Super Admin',
                clockInTimestamp: new Date().toISOString(),
            };
            setAttendanceRecords(prev => [...prev, newRecord]);
            const employeeName = users.find(u => u.uid === employeeId)?.fullName || 'N/A';
            addActivity('Absensi', `Menandai ${employeeName} sebagai Alfa pada ${today}`, newRecord.id);
            addToast({ title: 'Sukses', message: 'Pegawai telah ditandai sebagai Alfa.', type: 'success' });
        }
    };
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Laporan Absensi & Kinerja</h1>
            
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <CustomInput label="Dari Tanggal" type="date" value={filters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)} max={today} />
                    <CustomInput label="Sampai Tanggal" type="date" value={filters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)} max={today} />
                    <CustomSelect label="Filter Pegawai" value={filters.employeeId} onChange={e => handleFilterChange('employeeId', e.target.value)}>
                        <option value="all">Semua Pegawai</option>
                        {employees.map(emp => <option key={emp.uid} value={emp.uid}>{emp.fullName}</option>)}
                    </CustomSelect>
                     <Button variant="outline" onClick={resetFilters}><FilterX size={16}/> Reset Filter</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                    {(['all', 'Hadir', 'Sakit', 'Izin', 'Alfa'] as const).map(status => (
                        <Button key={status} size="sm" variant={filters.status === status ? 'primary' : 'ghost'} onClick={() => handleFilterChange('status', status)}>{status === 'all' ? 'Semua Status' : status}</Button>
                    ))}
                </div>
            </Card>

            {isTodaySelected && employeesWithoutAttendanceToday.length > 0 && (
                <Card>
                    <h2 className="text-lg font-bold text-yellow-700 flex items-center mb-4"><AlertTriangle size={20} className="mr-2"/> Pegawai Belum Absen Hari Ini</h2>
                    <div className="space-y-2">
                        {employeesWithoutAttendanceToday.map(employee => (
                            <div key={employee.uid} className="flex justify-between items-center bg-yellow-50 p-2 rounded-lg">
                                <p className="font-semibold text-sm">{employee.fullName}</p>
                                <Button size="sm" variant="danger" onClick={() => handleMarkAsAlpha(employee.uid)}>Tandai Alfa</Button>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            <div className="space-y-4">
                <AnimatePresence>
                {filteredRecords.map(record => {
                    const employee = employees.find(e => e.uid === record.userId);
                    if (!employee) return null;
                    return <AttendanceRecordCard key={record.id} record={record} employee={employee} onProofClick={setIsProofModalOpen} />;
                })}
                </AnimatePresence>
                 {filteredRecords.length === 0 && (
                    <Card className="text-center p-12 text-slate-500">
                        <p className="font-semibold">Tidak ada data absensi</p>
                        <p>Tidak ada catatan yang cocok dengan filter yang Anda pilih.</p>
                    </Card>
                )}
            </div>

            {isProofModalOpen && (
                <Modal isOpen={!!isProofModalOpen} onClose={() => setIsProofModalOpen(null)} title={`Bukti Kehadiran: ${users.find(u=>u.uid === isProofModalOpen.userId)?.fullName}`}>
                    <div className="space-y-2">
                        <p><strong>Status:</strong> {isProofModalOpen.status}</p>
                        <p><strong>Waktu:</strong> {formatDate(isProofModalOpen.clockInTimestamp)}</p>
                        <div className="pt-2 border-t mt-2">
                            {isProofModalOpen.status === 'Hadir' || isProofModalOpen.status === 'Sakit' ? (
                                <img src={isProofModalOpen.proof} alt={`Bukti ${isProofModalOpen.status}`} className="w-full h-auto rounded-lg max-h-96 object-contain" />
                            ) : (
                                <p className="whitespace-pre-wrap bg-slate-50 p-3 rounded-lg">{isProofModalOpen.proof}</p>
                            )}
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};