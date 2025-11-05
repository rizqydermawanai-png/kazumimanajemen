// pages/Sales.tsx
import React, { useState, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { CustomInput } from '../components/ui/CustomInput';
import { useToast } from '../hooks/useToast';
import { formatCurrency, formatDate, generateSequentialId } from '../lib/utils';
import type { Sale, SaleItem, UserData, FinishedGood, StockHistoryType, PromoCode } from '../types';
import { Plus, Trash2, PackageSearch, Tag } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';

interface SalesPageProps {
    sales: Sale[];
    setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
    currentUser: UserData;
    addActivity: (type: string, description: string, relatedId?: string) => void;
    finishedGoods: FinishedGood[];
    updateStock: (updates: { itemId: string, quantityChange: number, type: StockHistoryType, notes: string }[]) => boolean;
    promoCodes: PromoCode[];
}

export const SalesPage = ({ sales, setSales, currentUser, addActivity, finishedGoods, updateStock, promoCodes }: SalesPageProps) => {
    const [cart, setCart] = useState<SaleItem[]>([]);
    const [customerName, setCustomerName] = useState('Pelanggan');
    const [discount, setDiscount] = useState(0);
    const [tax, setTax] = useState(11); // PPN 11%
    const { addToast } = useToast();
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
    const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);

    const activePromos = useMemo(() => {
        const now = new Date();
        return promoCodes.filter(p => p.status === 'active' && new Date(p.startDate) <= now && new Date(p.endDate) >= now);
    }, [promoCodes]);

    const handleItemChange = (id: string, field: 'quantity', value: number) => {
        setCart(cart.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const addToCart = (product: FinishedGood) => {
        const existingItem = cart.find(item => item.id === product.id);
        const price = product.salePrice ?? product.sellingPrice;
        
        if (existingItem) {
            if (existingItem.quantity < product.stock) {
                 setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
            } else {
                addToast({ title: 'Stok Maksimal', message: `Stok ${product.name} tidak mencukupi.`, type: 'warning' });
            }
        } else {
            if (product.stock > 0) {
                 setCart([...cart, { 
                     id: product.id, 
                     name: `${product.name} ${product.size} (${product.colorName})`, 
                     quantity: 1, 
                     price: price, 
                     originalPrice: product.sellingPrice,
                     imageUrl: product.imageUrls?.[0],
                     weight: product.weight,
                }]);
            } else {
                 addToast({ title: 'Stok Habis', message: `${product.name} sedang habis.`, type: 'warning' });
            }
        }
    };
    
    const removeFromCart = (id: string) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const { subtotal, discountAmount, promoDiscountAmount, taxAmount, grandTotal } = useMemo(() => {
        const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
        const discountAmount = subtotal * (discount / 100);
        let subtotalAfterDiscount = subtotal - discountAmount;
        
        let promoDiscountAmount = 0;
        if (appliedPromo) {
            if (subtotalAfterDiscount >= (appliedPromo.minPurchase || 0)) {
                promoDiscountAmount = appliedPromo.type === 'fixed'
                    ? Math.min(appliedPromo.value, subtotalAfterDiscount)
                    : subtotalAfterDiscount * (appliedPromo.value / 100);
            }
        }
        
        subtotalAfterDiscount -= promoDiscountAmount;
        const taxAmount = subtotalAfterDiscount * (tax / 100);
        const grandTotal = subtotalAfterDiscount + taxAmount;

        return { subtotal, discountAmount, promoDiscountAmount, taxAmount, grandTotal };
    }, [cart, discount, appliedPromo, tax]);


    const handleCreateSale = () => {
        if (cart.length === 0) {
            addToast({ title: 'Error', message: 'Keranjang belanja masih kosong.', type: 'error' });
            return;
        }

        const newSale: Sale = {
            id: generateSequentialId('INV'),
            timestamp: new Date().toISOString(),
            userId: currentUser.uid,
            customerName,
            items: cart,
            result: { subtotal, discountAmount, promoDiscount: promoDiscountAmount, taxAmount, grandTotal },
            type: 'offline',
            promoCode: appliedPromo?.code
        };
        
        const stockUpdates = cart.map(item => ({
            itemId: item.id,
            quantityChange: -item.quantity,
            type: 'out-sale' as StockHistoryType,
            notes: `Penjualan POS #${newSale.id}`
        }));
        
        const stockUpdateSuccess = updateStock(stockUpdates);

        if (stockUpdateSuccess) {
            setSales(prev => [newSale, ...prev]);
            addActivity('Penjualan', `Mencatat penjualan baru #${newSale.id}`, newSale.id);
            addToast({ title: 'Penjualan Berhasil', message: 'Transaksi telah berhasil dicatat.', type: 'success' });
            
            // Reset form
            setCart([]);
            setCustomerName('Pelanggan');
            setDiscount(0);
            setAppliedPromo(null);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Point of Sale (POS)</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-md space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b">
                        <h2 className="font-semibold text-lg">Keranjang Belanja</h2>
                         <Button variant="outline" size="sm" onClick={() => setIsProductModalOpen(true)}><PackageSearch size={16}/> Pilih Produk</Button>
                    </div>
                    
                    <div className="space-y-2">
                        <AnimatePresence>
                        {cart.length > 0 ? cart.map(item => (
                            <motion.div 
                                key={item.id} 
                                layout
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                className="flex gap-3 items-center border-b last:border-b-0 py-2"
                            >
                                <img 
                                    src={item.imageUrl || 'https://placehold.co/40x40/e2e8f0/64748b?text=KZM'} 
                                    alt={item.name}
                                    className="w-12 h-12 rounded-md object-cover flex-shrink-0 bg-slate-100"
                                />
                                <div className="flex-grow">
                                    <p className="text-sm font-medium leading-tight">{item.name}</p>
                                    {item.originalPrice && item.price < item.originalPrice && (
                                         <p className="text-xs text-red-500">
                                            <span className="line-through text-slate-400 mr-1">{formatCurrency(item.originalPrice)}</span>
                                            {formatCurrency(item.price)}
                                        </p>
                                    )}
                                </div>
                                <div className="w-16 flex-shrink-0">
                                    <CustomInput 
                                        type="number" 
                                        value={item.quantity} 
                                        onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)} 
                                        className="text-center !py-1"
                                    />
                                </div>
                                <div className="w-24 text-right flex-shrink-0">
                                    <p className="text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                                </div>
                                <div className="flex-shrink-0">
                                    <Button variant="ghost" size="sm" className="!p-1 text-slate-400 hover:text-red-500" onClick={() => removeFromCart(item.id)}>
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </motion.div>
                        )) : <p className="text-center text-slate-500 py-8">Keranjang masih kosong.</p>}
                        </AnimatePresence>
                    </div>
                </div>
                
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
                        <CustomInput label="Nama Pelanggan" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                        <CustomInput label={`Diskon Manual (%)`} type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} />
                        <CustomInput label={`Pajak (%)`} type="number" value={tax} onChange={e => setTax(parseFloat(e.target.value) || 0)} />
                        <Button variant="outline" className="w-full" onClick={() => setIsPromoModalOpen(true)}><Tag size={16}/> {appliedPromo ? `Kode: ${appliedPromo.code}` : 'Pilih Kode Promo'}</Button>
                    </div>
                     <div className="bg-white p-6 rounded-xl shadow-md space-y-2 text-right">
                        <p>Subtotal: <span className="font-semibold">{formatCurrency(subtotal)}</span></p>
                        <p>Diskon Manual: <span className="font-semibold">-{formatCurrency(discountAmount)}</span></p>
                        {appliedPromo && <p>Diskon Promo: <span className="font-semibold">-{formatCurrency(promoDiscountAmount)}</span></p>}
                        <p>Pajak: <span className="font-semibold">+{formatCurrency(taxAmount)}</span></p>
                        <p className="text-2xl font-bold">Total: {formatCurrency(grandTotal)}</p>
                        <div className="pt-4">
                            <Button onClick={handleCreateSale} className="w-full">Buat Transaksi</Button>
                        </div>
                    </div>
                </div>
            </div>
            
             <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title="Pilih Produk">
                 <div className="space-y-2 max-h-96 overflow-y-auto">
                    {finishedGoods.filter(p => p.stock > 0).map(product => (
                        <div key={product.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-100">
                             <div className="flex items-center gap-3">
                                 <img 
                                    src={product.imageUrls?.[0] || `https://placehold.co/48x48/e2e8f0/64748b?text=KZM`}
                                    alt={product.name}
                                    className="w-12 h-12 rounded-lg object-cover bg-slate-100"
                                 />
                                <div>
                                    <p className="font-semibold">{product.name} {product.size} ({product.colorName})</p>
                                    <p className="text-xs text-slate-500">Stok: {product.stock} | {formatCurrency(product.salePrice ?? product.sellingPrice)}</p>
                                </div>
                            </div>
                            <Button size="sm" onClick={() => {addToCart(product); setIsProductModalOpen(false);}}><Plus size={16}/> Tambah</Button>
                        </div>
                    ))}
                 </div>
            </Modal>
            
            <Modal isOpen={isPromoModalOpen} onClose={() => setIsPromoModalOpen(false)} title="Pilih Kode Promo">
                 <div className="space-y-2 max-h-96 overflow-y-auto">
                    {appliedPromo && <Button variant="danger" className="w-full mb-2" onClick={() => {setAppliedPromo(null); setIsPromoModalOpen(false);}}>Hapus Promo</Button>}
                    {activePromos.length > 0 ? activePromos.map(promo => (
                        <button key={promo.id} onClick={() => { setAppliedPromo(promo); setIsPromoModalOpen(false); }} className="w-full text-left p-3 rounded-lg hover:bg-indigo-50 border disabled:opacity-50 disabled:cursor-not-allowed" disabled={subtotal < (promo.minPurchase || 0)}>
                            <p className="font-bold text-indigo-600">{promo.code}</p>
                            <p className="text-sm">{promo.type === 'fixed' ? `Potongan ${formatCurrency(promo.value)}` : `Diskon ${promo.value}%`}</p>
                            {promo.minPurchase && <p className="text-xs text-slate-500">Min. belanja {formatCurrency(promo.minPurchase)}</p>}
                        </button>
                    )) : <p className="text-center text-slate-500 py-4">Tidak ada promo yang aktif saat ini.</p>}
                 </div>
            </Modal>
        </div>
    );
};