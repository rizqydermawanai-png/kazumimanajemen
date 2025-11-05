// pages/MySalaryPage.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatCurrency, formatDate } from '../lib/utils';
import type { PayrollEntry, PayrollStatus } from '../types';
import { DollarSign, Printer, CheckCircle, Clock, Send, Wallet } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { usePrintPreview } from '../components/PrintProvider';
import { useToast } from '../hooks/useToast';
import { printSalarySlip } from '../lib/print';

const getStatusInfo = (status: PayrollStatus) => {
    const info: { [key in PayrollStatus]: { text: string; color: string; icon: React.ReactNode } } = {
        'processed': { text: 'Diproses Admin', color: 'text-blue-600', icon: <Clock size={16} /> },
        'paid': { text: 'Gaji Telah Dikirim', color: 'text-yellow-600', icon: <Send size={16} /> },
        'confirmed': { text: 'Telah Dikonfirmasi', color: 'text-green-600', icon: <CheckCircle size={16} /> },
    };
    return info[status] || info.processed;
};

export const MySalaryPage = () => {
    const { state, dispatch } = useAppContext();
    const { currentUser, payrollHistory, users } = state;
    const { showPrintPreview } = usePrintPreview();
    const { addToast } = useToast();

    if (!currentUser) return null;

    const mySalaries = payrollHistory
        .filter(p => p.employeeId === currentUser.uid)
        .sort((a, b) => new Date(b.period).getTime() - new Date(a.period).getTime());

    const handleConfirmSalary = (payrollId: string) => {
        dispatch({ type: 'CONFIRM_SALARY', payload: payrollId });
        addToast({ title: 'Konfirmasi Berhasil', message: 'Terima kasih telah mengonfirmasi penerimaan gaji Anda.', type: 'success' });
    };

    const handlePrintSlip = (payrollId: string) => {
        const payroll = payrollHistory.find(p => p.id === payrollId);
        const employee = users.find(u => u.uid === payroll?.employeeId);
        const issuer = users.find(u => u.uid === payroll?.processedById);
        
        if (payroll && employee && issuer) {
            printSalarySlip(payroll, employee, issuer, showPrintPreview);
        } else {
            addToast({ title: 'Error', message: 'Tidak dapat menemukan data untuk mencetak slip.', type: 'error' });
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-800">Riwayat Gaji Saya</h1>
                <p className="text-slate-600 mt-2">Lihat riwayat penggajian Anda dan konfirmasi penerimaan gaji setiap bulan.</p>
            </div>
            
            {mySalaries.length > 0 ? (
                <motion.div
                    className="space-y-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {mySalaries.map(payroll => {
                        const statusInfo = getStatusInfo(payroll.status);
                        return (
                            <motion.div key={payroll.id} variants={itemVariants}>
                                <Card className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex-grow">
                                        <p className="font-bold text-lg text-indigo-600">
                                            {new Date(payroll.period + '-02').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                                        </p>
                                        <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(payroll.netSalary)}</p>
                                        <div className={`flex items-center gap-2 mt-2 text-sm font-semibold ${statusInfo.color}`}>
                                            {statusInfo.icon}
                                            <span>{statusInfo.text}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                                        <Button variant="outline" size="sm" onClick={() => handlePrintSlip(payroll.id)} className="w-full sm:w-auto">
                                            <Printer size={16} />
                                            <span className="ml-2">Cetak Slip</span>
                                        </Button>
                                        {payroll.status === 'paid' && (
                                            <Button size="sm" onClick={() => handleConfirmSalary(payroll.id)} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                                                <CheckCircle size={16} />
                                                <span className="ml-2">Konfirmasi Diterima</span>
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </motion.div>
            ) : (
                <Card className="text-center p-12">
                     <Wallet size={48} className="mx-auto text-slate-400 mb-4" />
                    <h2 className="text-xl font-bold text-slate-700">Belum Ada Riwayat Gaji</h2>
                    <p className="text-slate-500 mt-2">Data penggajian Anda akan muncul di sini setelah diproses oleh admin.</p>
                </Card>
            )}
        </div>
    );
};
