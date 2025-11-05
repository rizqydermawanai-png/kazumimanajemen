// pages/LoyalCustomersPage.tsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Gift, Check, X, History } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { CustomSelect } from '../components/ui/CustomSelect';
import { useToast } from '../hooks/useToast';
import { formatCurrency, formatDate, getUsernameById } from '../lib/utils';
import type { UserData, Sale, PromoCode, CustomerVoucher, CustomerVoucherStatus } from '../types';

interface LoyalCustomersPageProps {
    currentUser: UserData;
    users: UserData[];
    sales: Sale[];
    promoCodes: PromoCode[];
    customerVouchers: CustomerVoucher[];
    setCustomerVouchers: React.Dispatch<React.SetStateAction<CustomerVoucher[]>>;
    addActivity: (type: string, description: string, relatedId?: string) => void;
}

type RankedCustomer = {
    name: string;
    totalSpent: number;
    orderCount: number;
};

const getStatusBadge = (status: CustomerVoucherStatus) => {
    const styles: { [key in CustomerVoucherStatus]: string } = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'approved': 'bg-green-100 text-green-800',
        'rejected': 'bg-red-100 text-red-800',
    };
    const text: { [key in CustomerVoucherStatus]: string } = {
        'pending': 'Pending',
        'approved': 'Disetujui',
        'rejected': 'Ditolak',
    };
    return <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${styles[status]}`}>{text[status]}</span>
};

export const LoyalCustomersPage = ({ currentUser, users, sales, promoCodes, customerVouchers, setCustomerVouchers, addActivity }: LoyalCustomersPageProps) => {
    const [view, setView] = useState<'list' | 'pending' | 'history'>('list');
    const [selectedCustomer, setSelectedCustomer] = useState<RankedCustomer | null>(null);
    const [selectedPromoId, setSelectedPromoId] = useState<string>('');
    const { addToast } = useToast();
    const isSuperAdmin = currentUser.role === 'super_admin';

    const rankedCustomers = useMemo<RankedCustomer[]>(() => {
        const customerData: { [name: string]: { totalSpent: number; orderCount: number } } = {};
        sales.forEach(sale => {
            if (!customerData[sale.customerName]) {
                customerData[sale.customerName] = { totalSpent: 0, orderCount: 0 };
            }
            customerData[sale.customerName].totalSpent += sale.result.grandTotal;
            customerData[sale.customerName].orderCount += 1;
        });

        return Object.entries(customerData)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.totalSpent - a.totalSpent);
    }, [sales]);

    const activePromos = useMemo(() => {
        const now = new Date();
        return promoCodes.filter(p => p.status === 'active' && new Date(p.startDate) <= now && new Date(p.endDate) >= now);
    }, [promoCodes]);
    
    const pendingVouchers = useMemo(() => customerVouchers.filter(v => v.status === 'pending'), [customerVouchers]);
    const approvedVouchers = useMemo(() => customerVouchers.filter(v => v.status === 'approved'), [customerVouchers]);

    const handleGiveVoucher = () => {
        if (!selectedCustomer || !selectedPromoId) {
            addToast({ title: 'Error', message: 'Pelanggan dan templat promo harus dipilih.', type: 'error' });
            return;
        }

        const promoTemplate = promoCodes.find(p => p.id === selectedPromoId);
        if (!promoTemplate) {
             addToast({ title: 'Error', message: 'Templat promo tidak valid.', type: 'error' });
            return;
        }
        
        const customerInitials = selectedCustomer.name.split(' ').map(n => n[0]).join('').toUpperCase();
        const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
        const newVoucherCode = `LOYAL-${customerInitials}-${randomChars}`;

        const newVoucher: CustomerVoucher = {
            id: crypto.randomUUID(),
            customerId: selectedCustomer.name, // Using name as ID for now
            customerName: selectedCustomer.name,
            voucherCode: newVoucherCode,
            promoId: selectedPromoId,
            status: isSuperAdmin ? 'approved' : 'pending',
            issuedBy: currentUser.uid,
            createdAt: new Date().toISOString(),
            ...(isSuperAdmin && { approvedBy: currentUser.uid, approvedAt: new Date().toISOString() })
        };
        
        setCustomerVouchers(prev => [...prev, newVoucher]);
        addActivity('Pelanggan Setia', `${isSuperAdmin ? 'Memberikan' : 'Mengajukan'} voucher ${newVoucherCode} untuk ${selectedCustomer.name}`, newVoucher.id);
        addToast({ title: 'Sukses', message: `Voucher telah ${isSuperAdmin ? 'diberikan' : 'diajukan untuk persetujuan'}.`, type: 'success' });
        
        setSelectedCustomer(null);
        setSelectedPromoId('');
    };

    const handleReviewVoucher = (voucherId: string, decision: 'approved' | 'rejected') => {
        setCustomerVouchers(prev => prev.map(v => v.id === voucherId ? {
            ...v,
            status: decision,
            approvedBy: currentUser.uid,
            approvedAt: new Date().toISOString()
        } : v));
        
        const voucher = customerVouchers.find(v => v.id === voucherId);
        if (voucher) {
            addActivity('Pelanggan Setia', `${decision === 'approved' ? 'Menyetujui' : 'Menolak'} voucher ${voucher.voucherCode}`, voucherId);
            addToast({ title: 'Berhasil', message: `Voucher telah ${decision === 'approved' ? 'disetujui' : 'ditolak'}.`, type: 'success' });
        }
    };
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Pelanggan Setia</h1>

            <div className="bg-white p-2 rounded-xl shadow-md flex gap-2 flex-wrap">
                <Button variant={view === 'list' ? 'primary' : 'ghost'} onClick={() => setView('list')} className="flex-1">Daftar Pelanggan</Button>
                {isSuperAdmin && <Button variant={view === 'pending' ? 'primary' : 'ghost'} onClick={() => setView('pending')} className="flex-1 relative">
                    Menunggu Persetujuan
                    {pendingVouchers.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">{pendingVouchers.length}</span>
                    )}
                </Button>}
                 <Button variant={view === 'history' ? 'primary' : 'ghost'} onClick={() => setView('history')} className="flex-1">Riwayat Voucher</Button>
            </div>

            <AnimatePresence mode="wait">
            <motion.div key={view} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                {view === 'list' && (
                    <Card className="p-0">
                        <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[600px]">
                            <thead className="bg-slate-50"><tr className="text-slate-600">
                                <th className="p-3 font-semibold">Peringkat</th>
                                <th className="p-3 font-semibold">Nama Pelanggan</th>
                                <th className="p-3 font-semibold">Total Belanja</th>
                                <th className="p-3 font-semibold">Jumlah Pesanan</th>
                                <th className="p-3 font-semibold"></th>
                            </tr></thead>
                            <tbody>
                                {rankedCustomers.map((customer, index) => (
                                    <tr key={customer.name} className="border-b last:border-b-0 hover:bg-slate-50/50">
                                        <td className="p-3 font-bold text-center">{index + 1}</td>
                                        <td className="p-3 font-semibold">{customer.name}</td>
                                        <td className="p-3">{formatCurrency(customer.totalSpent)}</td>
                                        <td className="p-3 text-center">{customer.orderCount}</td>
                                        <td className="p-3 text-right">
                                            <Button size="sm" onClick={() => { setSelectedCustomer(customer); if(activePromos.length > 0) setSelectedPromoId(activePromos[0].id)}}>
                                                <Gift size={14}/> Berikan Voucher
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    </Card>
                )}
                
                {view === 'pending' && isSuperAdmin && (
                    <Card>
                        <h2 className="text-xl font-bold text-slate-700 mb-4">Voucher Menunggu Persetujuan</h2>
                        <div className="space-y-3">
                            {pendingVouchers.length > 0 ? pendingVouchers.map(voucher => (
                                <div key={voucher.id} className="bg-yellow-50 p-3 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">Voucher untuk: {voucher.customerName}</p>
                                        <p className="text-xs text-slate-500">Diajukan oleh: {getUsernameById(voucher.issuedBy, users)}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="danger" onClick={() => handleReviewVoucher(voucher.id, 'rejected')}><X size={14}/> Tolak</Button>
                                        <Button size="sm" variant="primary" className="bg-green-600 hover:bg-green-700" onClick={() => handleReviewVoucher(voucher.id, 'approved')}><Check size={14}/> Setujui</Button>
                                    </div>
                                </div>
                            )) : <p className="text-center text-slate-500 py-8">Tidak ada voucher yang menunggu persetujuan.</p>}
                        </div>
                    </Card>
                )}
                
                {view === 'history' && (
                     <Card className="p-0">
                        <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[700px]">
                            <thead className="bg-slate-50"><tr className="text-slate-600">
                                <th className="p-3 font-semibold">Pelanggan</th>
                                <th className="p-3 font-semibold">Kode Voucher</th>
                                <th className="p-3 font-semibold">Status</th>
                                <th className="p-3 font-semibold">Diberikan Oleh</th>
                                <th className="p-3 font-semibold">Disetujui Oleh</th>
                            </tr></thead>
                            <tbody>
                                {customerVouchers.filter(v => v.status !== 'pending').map(voucher => (
                                    <tr key={voucher.id} className="border-b last:border-b-0 hover:bg-slate-50/50">
                                        <td className="p-3 font-semibold">{voucher.customerName}</td>
                                        <td className="p-3 font-mono text-indigo-600">{voucher.voucherCode}</td>
                                        <td className="p-3">{getStatusBadge(voucher.status)}</td>
                                        <td className="p-3 text-xs whitespace-nowrap">{getUsernameById(voucher.issuedBy, users)}<br/>{formatDate(voucher.createdAt)}</td>
                                        <td className="p-3 text-xs whitespace-nowrap">{voucher.approvedBy ? getUsernameById(voucher.approvedBy, users) : '-'}<br/>{voucher.approvedAt ? formatDate(voucher.approvedAt) : ''}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    </Card>
                )}
            </motion.div>
            </AnimatePresence>

            <Modal isOpen={!!selectedCustomer} onClose={() => setSelectedCustomer(null)} title={`Beri Voucher untuk ${selectedCustomer?.name}`}>
                <div className="space-y-4">
                    <p>Pilih templat promo yang ingin Anda gunakan sebagai hadiah untuk pelanggan ini. Kode voucher unik akan dibuat secara otomatis.</p>
                    <CustomSelect label="Pilih Templat Promo" value={selectedPromoId} onChange={e => setSelectedPromoId(e.target.value)}>
                        {activePromos.map(promo => (
                            <option key={promo.id} value={promo.id}>
                                {promo.code} - {promo.type === 'fixed' ? formatCurrency(promo.value) : `${promo.value}% OFF`}
                            </option>
                        ))}
                    </CustomSelect>
                    {!isSuperAdmin && <p className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded-md">Voucher yang Anda berikan memerlukan persetujuan dari Super Admin sebelum dapat digunakan oleh pelanggan.</p>}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="secondary" onClick={() => setSelectedCustomer(null)}>Batal</Button>
                        <Button onClick={handleGiveVoucher} disabled={!selectedPromoId}>
                            {isSuperAdmin ? 'Kirim Hadiah' : 'Ajukan Hadiah'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
