// pages/PromoPage.tsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Percent, Edit, Trash2, Plus, Check, X, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { CustomInput } from '../components/ui/CustomInput';
import { CustomSelect } from '../components/ui/CustomSelect';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../hooks/useToast';
import { getUsernameById, formatDate, formatCurrency } from '../lib/utils';
import type { PromoCode, ProductDiscount, UserData, FinishedGood, PromotionStatus } from '../types';

interface PromoPageProps {
    currentUser: UserData;
    addActivity: (type: string, description: string, relatedId?: string) => void;
    promoCodes: PromoCode[];
    setPromoCodes: React.Dispatch<React.SetStateAction<PromoCode[]>>;
    productDiscounts: ProductDiscount[];
    setProductDiscounts: React.Dispatch<React.SetStateAction<ProductDiscount[]>>;
    finishedGoods: FinishedGood[];
    users: UserData[];
}

const getStatusBadge = (status: PromotionStatus) => {
    const styles: { [key in PromotionStatus]: string } = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'active': 'bg-green-100 text-green-800',
        'expired': 'bg-slate-100 text-slate-600',
        'rejected': 'bg-red-100 text-red-800',
        'inactive': 'bg-gray-100 text-gray-800',
    };
    const text: { [key in PromotionStatus]: string } = {
        'pending': 'Menunggu Persetujuan',
        'active': 'Aktif',
        'expired': 'Kedaluwarsa',
        'rejected': 'Ditolak',
        'inactive': 'Tidak Aktif',
    };
    return <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${styles[status] || styles.inactive}`}>{text[status] || 'N/A'}</span>;
};


export const PromoPage = ({ currentUser, addActivity, promoCodes, setPromoCodes, productDiscounts, setProductDiscounts, finishedGoods, users }: PromoPageProps) => {
    const [view, setView] = useState<'promoCodes' | 'productDiscounts'>('promoCodes');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState<PromoCode | ProductDiscount | null>(null);

    const { addToast } = useToast();
    const isSuperAdmin = currentUser.role === 'super_admin';

    const handleOpenModal = (promo: PromoCode | ProductDiscount | null = null) => {
        setEditingPromo(promo);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingPromo(null);
        setIsModalOpen(false);
    };
    
    const handleReview = (promoId: string, type: 'promoCodes' | 'productDiscounts', decision: 'active' | 'rejected') => {
        const updater = type === 'promoCodes' ? setPromoCodes : setProductDiscounts;
        updater((prev: any) => prev.map((p: any) => p.id === promoId ? { ...p, status: decision, approvedBy: currentUser.uid } : p));
        const promoName = (type === 'promoCodes' ? promoCodes.find(p => p.id === promoId)?.code : productDiscounts.find(p => p.id === promoId)?.productName) || 'N/A';
        addActivity('Promo', `${decision === 'active' ? 'Menyetujui' : 'Menolak'} promo: ${promoName}`, promoId);
        addToast({ title: 'Berhasil', message: `Promo telah ${decision === 'active' ? 'disetujui' : 'ditolak'}.`, type: 'success' });
    };

    const pendingPromosCount = useMemo(() => {
        const pendingCodes = promoCodes.filter(p => p.status === 'pending').length;
        const pendingDiscounts = productDiscounts.filter(p => p.status === 'pending').length;
        return pendingCodes + pendingDiscounts;
    }, [promoCodes, productDiscounts]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Manajemen Promo & Diskon</h1>
            
            <div className="bg-white p-2 rounded-xl shadow-md flex gap-2 flex-wrap">
                <Button variant={view === 'promoCodes' ? 'primary' : 'ghost'} onClick={() => setView('promoCodes')} className="flex-1">Kode Promo</Button>
                <Button variant={view === 'productDiscounts' ? 'primary' : 'ghost'} onClick={() => setView('productDiscounts')} className="flex-1 relative">
                    Diskon Produk
                    {isSuperAdmin && pendingPromosCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">{pendingPromosCount}</span>
                    )}
                </Button>
            </div>
            
             <AnimatePresence mode="wait">
                <motion.div key={view} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                    {view === 'promoCodes' && <PromoCodeView promos={promoCodes} onAdd={() => handleOpenModal(null)} onReview={(id, decision) => handleReview(id, 'promoCodes', decision)} isSuperAdmin={isSuperAdmin} users={users} />}
                    {view === 'productDiscounts' && <ProductDiscountView promos={productDiscounts} onAdd={() => handleOpenModal(null)} onReview={(id, decision) => handleReview(id, 'productDiscounts', decision)} isSuperAdmin={isSuperAdmin} users={users} />}
                </motion.div>
            </AnimatePresence>

            {isModalOpen && (
                 <PromoModal 
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    type={view}
                    currentUser={currentUser}
                    addActivity={addActivity}
                    setPromoCodes={setPromoCodes}
                    setProductDiscounts={setProductDiscounts}
                    finishedGoods={finishedGoods}
                 />
            )}
        </div>
    );
};

const PromoCodeView = ({ promos, onAdd, onReview, isSuperAdmin, users }: any) => {
    const pending = promos.filter((p: PromoCode) => p.status === 'pending');
    const others = promos.filter((p: PromoCode) => p.status !== 'pending');

    return (
        <div className="space-y-4">
            <Card>
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-700">Kode Promo</h2>
                    <Button onClick={onAdd}><Plus size={16}/> Buat Kode Promo</Button>
                </div>
            </Card>
            {isSuperAdmin && pending.length > 0 && <PendingReviewList items={pending} onReview={onReview} type="promo" users={users} />}
            <Card className="p-0"><div className="overflow-x-auto"><PromoList items={others} type="promo" /></div></Card>
        </div>
    );
};

const ProductDiscountView = ({ promos, onAdd, onReview, isSuperAdmin, users }: any) => {
    const pending = promos.filter((p: ProductDiscount) => p.status === 'pending');
    const others = promos.filter((p: ProductDiscount) => p.status !== 'pending');

    return (
        <div className="space-y-4">
            <Card>
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-700">Diskon Produk</h2>
                    <Button onClick={onAdd}><Plus size={16}/> Buat Diskon Produk</Button>
                </div>
            </Card>
            {isSuperAdmin && pending.length > 0 && <PendingReviewList items={pending} onReview={onReview} type="discount" users={users} />}
            <Card className="p-0"><div className="overflow-x-auto"><PromoList items={others} type="discount" /></div></Card>
        </div>
    );
};

const PendingReviewList = ({ items, onReview, type, users }: any) => (
    <Card>
        <h3 className="font-bold text-yellow-700 mb-2">Menunggu Persetujuan Anda</h3>
        <div className="space-y-2">
            {items.map((promo: any) => (
                <div key={promo.id} className="bg-yellow-50 p-3 rounded-lg flex justify-between items-center">
                    <div>
                        <p className="font-semibold">{type === 'promo' ? promo.code : promo.productName}</p>
                        <p className="text-xs text-slate-500">Diajukan oleh: {getUsernameById(promo.requestedBy, users)}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="danger" onClick={() => onReview(promo.id, 'rejected')}><X size={14}/> Tolak</Button>
                        <Button size="sm" variant="primary" className="bg-green-600 hover:bg-green-700" onClick={() => onReview(promo.id, 'active')}><Check size={14}/> Setujui</Button>
                    </div>
                </div>
            ))}
        </div>
    </Card>
);

const PromoList = ({ items, type }: { items: (PromoCode | ProductDiscount)[], type: 'promo' | 'discount' }) => (
    <table className="w-full text-sm text-left min-w-[600px]">
        <thead className="bg-slate-50"><tr className="text-slate-600">
            <th className="p-3 font-semibold">{type === 'promo' ? 'Kode' : 'Produk'}</th>
            <th className="p-3 font-semibold">Diskon</th>
            <th className="p-3 font-semibold">Masa Berlaku</th>
            <th className="p-3 font-semibold">Status</th>
        </tr></thead>
        <tbody>
            {items.length > 0 ? items.map(promo => {
                // FIX: Differentiate between PromoCode and ProductDiscount to access correct properties.
                // PromoCode uses `type` and `value`, while ProductDiscount uses `discountType` and `discountValue`.
                const isPromoCode = 'code' in promo;
                const discountType = isPromoCode ? promo.type : promo.discountType;
                const discountValue = isPromoCode ? promo.value : promo.discountValue;

                return (
                    <tr key={promo.id} className="border-b last:border-b-0">
                        <td className="p-3 font-semibold">{isPromoCode ? promo.code : promo.productName}</td>
                        <td className="p-3">{discountType === 'fixed' ? formatCurrency(discountValue) : `${discountValue}%`}</td>
                        <td className="p-3 text-xs whitespace-nowrap">{formatDate(promo.startDate)} - {formatDate(promo.endDate)}</td>
                        <td className="p-3">{getStatusBadge(promo.status)}</td>
                    </tr>
                );
            }) : <tr><td colSpan={4} className="text-center p-8 text-slate-500">Tidak ada data.</td></tr>}
        </tbody>
    </table>
);

const PromoModal = ({ isOpen, onClose, type, currentUser, addActivity, setPromoCodes, setProductDiscounts, finishedGoods }: any) => {
    const { addToast } = useToast();
    const isSuperAdmin = currentUser.role === 'super_admin';
    const [form, setForm] = useState({
        code: '',
        type: 'percentage',
        value: 10,
        minPurchase: 0,
        productId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0]
    });

    const handleChange = (field: string, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        const status = isSuperAdmin ? 'active' : 'pending';
        
        if (type === 'promoCodes') {
            const newPromo: PromoCode = {
                id: crypto.randomUUID(),
                code: form.code.toUpperCase(),
                type: form.type as 'percentage' | 'fixed',
                value: Number(form.value),
                minPurchase: Number(form.minPurchase),
                startDate: form.startDate,
                endDate: form.endDate,
                status,
                requestedBy: currentUser.uid,
            };
            setPromoCodes((prev: PromoCode[]) => [...prev, newPromo]);
            addActivity('Promo', `${isSuperAdmin ? 'Membuat' : 'Mengajukan'} kode promo: ${newPromo.code}`, newPromo.id);
        } else {
            const product = finishedGoods.find((p: FinishedGood) => p.id === form.productId);
            if (!product) {
                addToast({ title: 'Error', message: 'Produk tidak ditemukan.', type: 'error' });
                return;
            }
            const newDiscount: ProductDiscount = {
                id: crypto.randomUUID(),
                productId: form.productId,
                productName: `${product.name} ${product.size}`,
                discountType: form.type as 'percentage' | 'fixed',
                discountValue: Number(form.value),
                startDate: form.startDate,
                endDate: form.endDate,
                status,
                requestedBy: currentUser.uid,
            };
            setProductDiscounts((prev: ProductDiscount[]) => [...prev, newDiscount]);
            addActivity('Promo', `${isSuperAdmin ? 'Membuat' : 'Mengajukan'} diskon produk untuk: ${newDiscount.productName}`, newDiscount.id);
        }
        
        addToast({ title: 'Sukses', message: `Promo telah ${isSuperAdmin ? 'dibuat' : 'diajukan untuk persetujuan'}.`, type: 'success' });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={type === 'promoCodes' ? "Buat Kode Promo Baru" : "Buat Diskon Produk Baru"}>
            <div className="space-y-4">
                {type === 'promoCodes' ? (
                    <CustomInput label="Kode Promo" value={form.code} onChange={e => handleChange('code', e.target.value.toUpperCase())} />
                ) : (
                    <CustomSelect label="Pilih Produk" value={form.productId} onChange={e => handleChange('productId', e.target.value)}>
                        <option value="">-- Pilih Produk --</option>
                        {finishedGoods.map((p: FinishedGood) => <option key={p.id} value={p.id}>{p.name} {p.size} ({p.colorName})</option>)}
                    </CustomSelect>
                )}
                <div className="grid grid-cols-2 gap-4">
                    <CustomSelect label="Tipe Diskon" value={form.type} onChange={e => handleChange('type', e.target.value)}>
                        <option value="percentage">Persentase (%)</option>
                        <option value="fixed">Potongan Tetap (Rp)</option>
                    </CustomSelect>
                    <CustomInput label="Nilai Diskon" type="number" value={form.value} onChange={e => handleChange('value', e.target.value)} />
                </div>
                {type === 'promoCodes' && <CustomInput label="Minimum Pembelian (Rp)" type="number" value={form.minPurchase} onChange={e => handleChange('minPurchase', e.target.value)} />}
                <div className="grid grid-cols-2 gap-4">
                    <CustomInput label="Tanggal Mulai" type="date" value={form.startDate} onChange={e => handleChange('startDate', e.target.value)} />
                    <CustomInput label="Tanggal Selesai" type="date" value={form.endDate} onChange={e => handleChange('endDate', e.target.value)} />
                </div>
                {!isSuperAdmin && <p className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded-md">Promo yang Anda buat memerlukan persetujuan dari Super Admin sebelum aktif.</p>}
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="secondary" onClick={onClose}>Batal</Button>
                    <Button onClick={handleSubmit}>{isSuperAdmin ? 'Buat & Aktifkan' : 'Ajukan Promo'}</Button>
                </div>
            </div>
        </Modal>
    );
};