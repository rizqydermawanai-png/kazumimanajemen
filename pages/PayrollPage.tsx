// pages/PayrollPage.tsx
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CustomInput } from '../components/ui/CustomInput';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../hooks/useToast';
// FIX: Correct the import path for usePrintPreview.
import { usePrintPreview } from '../components/PrintProvider';
import { printSalarySlip } from '../lib/print';
import { formatCurrency, formatDate, getUsernameById } from '../lib/utils';
import type { UserData, PayrollEntry } from '../types';
import { DollarSign, Printer, Plus, Trash2, History, Send, CheckCircle } from 'lucide-react';

interface PayrollPageProps {
    currentUser: UserData;
    users: UserData[];
    setUsers: React.Dispatch<React.SetStateAction<UserData[]>>;
    payrollHistory: PayrollEntry[];
    setPayrollHistory: React.Dispatch<React.SetStateAction<PayrollEntry[]>>;
    addActivity: (type: string, description: string, relatedId?: string) => void;
}

export const PayrollPage = ({ currentUser, users, setUsers, payrollHistory, setPayrollHistory, addActivity }: PayrollPageProps) => {
    const [view, setView] = useState<'process' | 'history'>('process');
    const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<UserData | null>(null);

    const [salaryDetails, setSalaryDetails] = useState({
        allowances: [{ id: crypto.randomUUID(), name: 'Tunjangan Transport', amount: 0 }],
        deductions: [{ id: crypto.randomUUID(), name: 'BPJS', amount: 0 }],
    });

    const { addToast } = useToast();
    const { showPrintPreview } = usePrintPreview();
    
    const staff = useMemo(() => users.filter(u => ['member', 'admin', 'kepala_gudang', 'kepala_produksi', 'kepala_penjualan', 'penjualan'].includes(u.role)), [users]);
    
    const handleOpenModal = (employee: UserData) => {
        setSelectedEmployee(employee);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedEmployee(null);
        setIsModalOpen(false);
        setSalaryDetails({
            allowances: [{ id: crypto.randomUUID(), name: 'Tunjangan Transport', amount: 0 }],
            deductions: [{ id: crypto.randomUUID(), name: 'BPJS', amount: 0 }],
        });
    };

    const handleDetailChange = (type: 'allowances' | 'deductions', id: string, field: 'name' | 'amount', value: string | number) => {
        setSalaryDetails(prev => ({
            ...prev,
            [type]: prev[type].map(item => item.id === id ? { ...item, [field]: value } : item)
        }));
    };

    const addDetailItem = (type: 'allowances' | 'deductions') => {
        setSalaryDetails(prev => ({
            ...prev,
            [type]: [...prev[type], { id: crypto.randomUUID(), name: '', amount: 0 }]
        }));
    };

    const removeDetailItem = (type: 'allowances' | 'deductions', id: string) => {
        setSalaryDetails(prev => ({
            ...prev,
            [type]: prev[type].filter(item => item.id !== id)
        }));
    };

    const handleProcessPayroll = () => {
        if (!selectedEmployee) return;

        const baseSalary = selectedEmployee.baseSalary || 0;
        const totalAllowances = salaryDetails.allowances.reduce((sum, item) => sum + Number(item.amount), 0);
        const totalDeductions = salaryDetails.deductions.reduce((sum, item) => sum + Number(item.amount), 0);
        const netSalary = baseSalary + totalAllowances - totalDeductions;

        const newPayrollEntry: PayrollEntry = {
            id: `payroll-${selectedEmployee.uid}-${selectedPeriod}`,
            employeeId: selectedEmployee.uid,
            employeeName: selectedEmployee.fullName,
            period: selectedPeriod,
            baseSalary,
            allowances: salaryDetails.allowances.filter(item => item.name && item.amount > 0),
            deductions: salaryDetails.deductions.filter(item => item.name && item.amount > 0),
            netSalary,
            processedById: currentUser.uid,
            processedAt: new Date().toISOString(),
            status: 'processed',
        };

        setPayrollHistory(prev => [...prev.filter(p => p.id !== newPayrollEntry.id), newPayrollEntry]);
        
        setUsers(prevUsers => 
            prevUsers.map(u => 
                u.uid === selectedEmployee.uid 
                ? { ...u, lastPayrollDate: new Date().toISOString() } 
                : u
            )
        );

        addActivity('Penggajian', `Memproses gaji untuk ${selectedEmployee.fullName} periode ${selectedPeriod}`, newPayrollEntry.id);
        addToast({ title: 'Sukses', message: 'Gaji berhasil diproses.', type: 'success' });
        handleCloseModal();
    };
    
    const handleMarkAsPaid = (payrollId: string) => {
        setPayrollHistory(prev => prev.map(p => 
            p.id === payrollId 
            ? { ...p, status: 'paid', paidAt: new Date().toISOString() } 
            : p
        ));
        const payroll = payrollHistory.find(p => p.id === payrollId);
        if (payroll) {
            addActivity('Penggajian', `Menandai gaji ${payroll.employeeName} periode ${payroll.period} sudah dibayar.`);
            addToast({ title: 'Sukses', message: 'Gaji telah ditandai sebagai terkirim.', type: 'success' });
        }
    };

    const handlePrint = (payrollId: string) => {
        const payroll = payrollHistory.find(p => p.id === payrollId);
        const employee = users.find(u => u.uid === payroll?.employeeId);
        if (payroll && employee) {
            printSalarySlip(payroll, employee, currentUser, showPrintPreview);
        }
    };
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Manajemen Penggajian</h1>
            
            <div className="bg-white p-2 rounded-xl shadow-md flex gap-2 flex-wrap">
                <Button variant={view === 'process' ? 'primary' : 'ghost'} onClick={() => setView('process')} className="flex-1">Proses Gaji</Button>
                <Button variant={view === 'history' ? 'primary' : 'ghost'} onClick={() => setView('history')} className="flex-1">Riwayat Gaji</Button>
            </div>
            
            {view === 'process' && (
                <Card>
                    <div className="flex items-center gap-4 mb-4">
                        <label htmlFor="period-selector" className="font-semibold">Pilih Periode:</label>
                        <CustomInput id="period-selector" type="month" value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)} className="w-48" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[600px]">
                            <thead className="bg-slate-50"><tr className="text-slate-600">
                                <th className="p-3 font-semibold">Nama Pegawai</th>
                                <th className="p-3 font-semibold">Departemen</th>
                                <th className="p-3 font-semibold">Gaji Pokok</th>
                                <th className="p-3 font-semibold text-center">Status</th>
                                <th className="p-3 font-semibold"></th>
                            </tr></thead>
                            <tbody>
                                {staff.map(employee => {
                                    const payrollRecord = payrollHistory.find(p => p.employeeId === employee.uid && p.period === selectedPeriod);
                                    return (
                                        <tr key={employee.uid} className="border-b last:border-b-0 hover:bg-slate-50/50">
                                            <td className="p-3 font-semibold">{employee.fullName}</td>
                                            <td className="p-3">{employee.department}</td>
                                            <td className="p-3">{formatCurrency(employee.baseSalary)}</td>
                                            <td className="p-3 text-center">
                                                {payrollRecord ? (
                                                    payrollRecord.status === 'processed' ? <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Diproses Admin</span> :
                                                    payrollRecord.status === 'paid' ? <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Terkirim ke Pegawai</span> :
                                                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Dikonfirmasi Pegawai</span>
                                                ) : (
                                                    <span className="bg-slate-100 text-slate-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Belum Diproses</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-right">
                                                {!payrollRecord ? (
                                                    <Button size="sm" onClick={() => handleOpenModal(employee)}>
                                                        <DollarSign size={14}/> Proses Gaji
                                                    </Button>
                                                ) : payrollRecord.status === 'processed' ? (
                                                    <Button size="sm" variant="outline" onClick={() => handleMarkAsPaid(payrollRecord.id)}>
                                                        <Send size={14}/> Tandai Sudah Dibayar
                                                    </Button>
                                                ) : (
                                                    <Button size="sm" variant="ghost" disabled className="text-green-600">
                                                        <CheckCircle size={14}/> Selesai
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

             {view === 'history' && (
                <Card className="p-0">
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[700px]">
                        <thead className="bg-slate-50"><tr className="text-slate-600">
                            <th className="p-3 font-semibold">Periode</th>
                            <th className="p-3 font-semibold">Nama Pegawai</th>
                            <th className="p-3 font-semibold">Gaji Bersih</th>
                            <th className="p-3 font-semibold">Status</th>
                            <th className="p-3 font-semibold">Diproses Oleh</th>
                            <th className="p-3 font-semibold"></th>
                        </tr></thead>
                        <tbody>
                            {payrollHistory.sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime()).map(p => (
                                <tr key={p.id} className="border-b last:border-b-0">
                                    <td className="p-3 font-semibold">{p.period}</td>
                                    <td className="p-3">{p.employeeName}</td>
                                    <td className="p-3 font-bold text-indigo-600">{formatCurrency(p.netSalary)}</td>
                                    <td className="p-3">
                                        {p.status === 'processed' ? <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Diproses</span> :
                                         p.status === 'paid' ? <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Terkirim</span> :
                                         <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Dikonfirmasi</span>
                                        }
                                    </td>
                                    <td className="p-3">{getUsernameById(p.processedById, users)}</td>
                                    <td className="p-3 text-right">
                                        <Button size="sm" variant="outline" onClick={() => handlePrint(p.id)}><Printer size={14}/> Cetak Slip</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                     {payrollHistory.length === 0 && <div className="text-center p-8 text-slate-500"><History size={24} className="mx-auto mb-2" />Belum ada riwayat penggajian.</div>}
                </Card>
            )}
            
            {selectedEmployee && (
                <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={`Proses Gaji: ${selectedEmployee.fullName}`}>
                    <div className="space-y-4">
                        <div className="p-3 bg-slate-100 rounded-lg">
                            <div className="flex justify-between"><span>Gaji Pokok:</span> <span className="font-bold">{formatCurrency(selectedEmployee.baseSalary)}</span></div>
                        </div>

                        {/* Tunjangan */}
                        <div>
                            <h3 className="font-semibold mb-2 text-green-600">Tunjangan</h3>
                            {salaryDetails.allowances.map(item => (
                                <div key={item.id} className="flex gap-2 items-center mb-2">
                                    <CustomInput placeholder="Nama Tunjangan" value={item.name} onChange={e => handleDetailChange('allowances', item.id, 'name', e.target.value)} className="flex-grow"/>
                                    <CustomInput type="number" placeholder="Jumlah" value={item.amount} onChange={e => handleDetailChange('allowances', item.id, 'amount', Number(e.target.value))} />
                                    <Button variant="ghost" size="sm" className="!p-2 text-slate-400 hover:text-red-500" onClick={() => removeDetailItem('allowances', item.id)}><Trash2 size={16}/></Button>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => addDetailItem('allowances')}><Plus size={16}/> Tambah Tunjangan</Button>
                        </div>

                        {/* Potongan */}
                        <div>
                            <h3 className="font-semibold mb-2 text-red-600">Potongan</h3>
                            {salaryDetails.deductions.map(item => (
                                <div key={item.id} className="flex gap-2 items-center mb-2">
                                    <CustomInput placeholder="Nama Potongan" value={item.name} onChange={e => handleDetailChange('deductions', item.id, 'name', e.target.value)} className="flex-grow"/>
                                    <CustomInput type="number" placeholder="Jumlah" value={item.amount} onChange={e => handleDetailChange('deductions', item.id, 'amount', Number(e.target.value))} />
                                    <Button variant="ghost" size="sm" className="!p-2 text-slate-400 hover:text-red-500" onClick={() => removeDetailItem('deductions', item.id)}><Trash2 size={16}/></Button>
                                </div>
                            ))}
                             <Button variant="outline" size="sm" onClick={() => addDetailItem('deductions')}><Plus size={16}/> Tambah Potongan</Button>
                        </div>
                        
                        <div className="pt-4 border-t mt-4 flex justify-end gap-2">
                            <Button variant="secondary" onClick={handleCloseModal}>Batal</Button>
                            <Button onClick={handleProcessPayroll}>Proses Gaji</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};