// pages/Production.tsx
import React, { useState, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { CustomInput } from '../components/ui/CustomInput';
import { CustomSelect } from '../components/ui/CustomSelect';
import { useToast } from '../hooks/useToast';
import { formatCurrency, getUsernameById, formatDate, generateSequentialId } from '../lib/utils';
import { calculateHPP as calculateHPPLogic } from '../lib/calculations';
import type { Material, ProductionReport, UserData, GarmentOrderItem, AdditionalCost, MaterialPriceUnit, StockHistoryType, AllSizingStandards, ProductionRequest, ProductionRequestStatus, FinishedGood, GarmentPattern } from '../types';
import { Plus, Trash2, Calculator, Check, BarChart3, ThumbsUp, Inbox, History, CircleDashed, Wrench } from 'lucide-react';
// FIX: Import Variants type from framer-motion to resolve type inference issues with animation props.
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ChartComponent } from '../components/Chart';
import { Card } from '../components/ui/Card';
import { useAppContext } from '../context/AppContext';

interface ProductionPageProps {
    materials: Material[];
    productionReports: ProductionReport[];
    setProductionReports: React.Dispatch<React.SetStateAction<ProductionReport[]>>;
    currentUser: UserData;
    addActivity: (type: string, description: string, relatedId?: string) => void;
    updateStock: (updates: { itemId: string, quantityChange: number, type: StockHistoryType, notes: string }[]) => boolean;
    sizingStandards: AllSizingStandards;
    productionRequests: ProductionRequest[];
    setProductionRequests: React.Dispatch<React.SetStateAction<ProductionRequest[]>>;
    users: UserData[];
    finishedGoods: FinishedGood[];
    garmentPatterns: { [key: string]: GarmentPattern };
}

// Helper function to safely initialize the order state, preventing crashes.
const getInitialOrderState = (sizingStandards: AllSizingStandards, garmentPatterns: { [key: string]: GarmentPattern }): GarmentOrderItem[] => {
    const initialGarmentKey = Object.keys(garmentPatterns)[0];
    const garmentInfo = garmentPatterns[initialGarmentKey];
    const initialModel = garmentInfo.models[0] || null;
    const availableSizes = Object.keys(sizingStandards[initialGarmentKey] || {});
    const initialSize = availableSizes[0] || 'M';

    return [{
        id: crypto.randomUUID(),
        model: initialModel,
        size: initialSize,
        quantity: 10,
        colorName: 'Hitam',
        colorCode: '#000000'
    }];
};

interface RequestCardProps {
    request: ProductionRequest;
    users: UserData[];
    onApproveRequest: (requestId: string) => void;
    onFulfillRequest: (request: ProductionRequest) => void;
}

const RequestCard: React.FC<RequestCardProps> = ({ request, users, onApproveRequest, onFulfillRequest }) => (
    <div className="bg-white p-4 rounded-xl shadow-md border hover:shadow-lg transition-shadow duration-300">
        <div className="flex justify-between items-start">
            <div>
                <p className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md inline-block mb-2">{request.id}</p>
                {request.items.map((item, index) => (
                    <div key={index} className={index > 0 ? "mt-2 pt-2 border-t" : ""}>
                        <p className="font-bold text-lg">{item.productName}</p>
                        <p className="text-xl font-bold text-indigo-600">{item.requestedQuantity} pcs</p>
                    </div>
                ))}
            </div>
            <div className="text-right">
                <p className="text-sm font-semibold">{getUsernameById(request.requestedBy, users)}</p>
                <p className="text-xs text-slate-500">{formatDate(request.timestamp)}</p>
            </div>
        </div>
        <p className="text-sm text-slate-600 mt-2 pt-2 border-t"><strong>Catatan:</strong> {request.notes || '-'}</p>
        <div className="flex gap-2 justify-end mt-4">
            {request.status === 'pending' && (
                <Button size="sm" variant="primary" onClick={() => onApproveRequest(request.id)}>
                    <ThumbsUp size={14} className="mr-1"/> Setujui & Proses
                </Button>
            )}
             {request.status === 'approved_by_production' && (
                <Button size="sm" variant="primary" className="bg-green-600 hover:bg-green-700" onClick={() => onFulfillRequest(request)}>
                    <Check size={14} /> Selesaikan Produksi
                </Button>
            )}
        </div>
    </div>
);


export const ProductionPage = ({ materials, productionReports, setProductionReports, currentUser, addActivity, updateStock, sizingStandards, productionRequests, setProductionRequests, users, finishedGoods, garmentPatterns }: ProductionPageProps) => {
    const { state } = useAppContext();
    const { standardProductionCosts, standardProfitMargin } = state;

    const [view, setView] = useState<'calculator' | 'requests'>('calculator');
    const [selectedGarment, setSelectedGarment] = useState(Object.keys(garmentPatterns)[0]);
    
    const [materialPriceUnit, setMaterialPriceUnit] = useState<MaterialPriceUnit>('kg');
    const [materialPrice, setMaterialPrice] = useState(materials.find(m => m.id === garmentPatterns[selectedGarment].materialId)?.pricePerUnit || 0);
    const [rollConversion, setRollConversion] = useState(25);
    const [order, setOrder] = useState<GarmentOrderItem[]>(() => getInitialOrderState(sizingStandards, garmentPatterns));
    const [additionalCosts, setAdditionalCosts] = useState<AdditionalCost[]>(() => 
        standardProductionCosts.map(c => ({...c, id: crypto.randomUUID()}))
    );
    const [profitMargin, setProfitMargin] = useState(standardProfitMargin);
    
    const [hppResult, setHppResult] = useState<ProductionReport['hppResult'] | null>(null);
    const [fulfillingRequestId, setFulfillingRequestId] = useState<string | null>(null);
    const { addToast } = useToast();
    
    const pendingRequestsCount = useMemo(() => productionRequests.filter(r => r.status === 'pending').length, [productionRequests]);

    const selectedGarmentInfo = useMemo(() => garmentPatterns[selectedGarment], [selectedGarment, garmentPatterns]);

    // Memoize filtered production requests to prevent re-filtering on every render
    const pendingRequests = useMemo(() => productionRequests.filter(r => r.status === 'pending'), [productionRequests]);
    const approvedRequests = useMemo(() => productionRequests.filter(r => r.status === 'approved_by_production'), [productionRequests]);
    const otherRequests = useMemo(() => productionRequests.filter(r => r.status !== 'pending' && r.status !== 'approved_by_production').sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [productionRequests]);


    const resetFormForNewGarment = (garmentKey: string) => {
        setSelectedGarment(garmentKey);
        setHppResult(null);
        setFulfillingRequestId(null);
        const newGarmentInfo = garmentPatterns[garmentKey];
        const newModel = newGarmentInfo.models[0] || null;
        const newSizes = Object.keys(sizingStandards[garmentKey] || {});
        setOrder([{ id: crypto.randomUUID(), model: newModel, size: newSizes[0] || 'M', quantity: 10, colorName: 'Hitam', colorCode: '#000000' }]);
        setMaterialPrice(materials.find(m => m.id === newGarmentInfo.materialId)?.pricePerUnit || 0);
        setAdditionalCosts(standardProductionCosts.map(c => ({...c, id: crypto.randomUUID()})));
        setProfitMargin(standardProfitMargin);
    };

    // Handlers for dynamic forms
    const handleOrderChange = (id: string, field: keyof GarmentOrderItem, value: any) => {
        setOrder(order.map(item => {
            if (item.id === id) {
                const newItem = { ...item, [field]: value };
                
                if (field === 'model') {
                    const newSizes = Object.keys(sizingStandards[selectedGarment] || {});
                    newItem.size = newSizes[0] || '';
                }

                if (field === 'colorName') {
                    newItem.colorCode = value.toLowerCase();
                }

                return newItem;
            }
            return item;
        }));
    };

    const addOrderItem = () => {
        const defaultModel = selectedGarmentInfo.models[0] || null;
        const availableSizes = Object.keys(sizingStandards[selectedGarment] || {});
        setOrder([...order, { id: crypto.randomUUID(), model: defaultModel, size: availableSizes[0] || 'M', quantity: 1, colorName: 'Putih', colorCode: '#ffffff' }]);
    }
    const removeOrderItem = (id: string) => setOrder(order.filter(item => item.id !== id));

    const handleCostChange = (id: string, field: keyof AdditionalCost, value: any) => {
        setAdditionalCosts(additionalCosts.map(item => item.id === id ? { ...item, [field]: value } : item));
    };
    const addAdditionalCost = () => setAdditionalCosts([...additionalCosts, { id: crypto.randomUUID(), name: '', cost: 0 }]);
    const removeAdditionalCost = (id: string) => setAdditionalCosts(additionalCosts.filter(item => item.id !== id));
    
    const calculateHPP = () => {
        const materialUsed = materials.find(m => m.id === selectedGarmentInfo.materialId);
        
        // For 'kepala_gudang', use standard costs but don't show the form. For others, use the form's state.
        const costsToUse = currentUser.role === 'kepala_gudang' ? standardProductionCosts : additionalCosts;

        const result = calculateHPPLogic({
            garmentInfo: selectedGarmentInfo,
            materialPrice,
            materialPriceUnit,
            order,
            additionalCosts: costsToUse,
            materialName: materialUsed?.name || 'Bahan Utama',
            profitMargin,
            rollConversion,
            materials,
        });
        
        if (!result.success) {
            addToast({ title: 'Error Kalkulasi', message: result.message, type: 'error' });
            return;
        }

        setHppResult(result.data);
        addToast({ title: 'Kalkulasi Berhasil', message: 'Hasil HPP telah ditampilkan.', type: 'success' });
    };

    const confirmProduction = () => {
        if (!hppResult) return;
        
        const materialUsedId = selectedGarmentInfo.materialId;
        const requiredStock = hppResult.materialConsumption[0].quantity;
        
        const stockUpdateSuccess = updateStock([{
            itemId: materialUsedId,
            quantityChange: -requiredStock,
            type: 'out-production',
            notes: `Untuk produksi ${selectedGarmentInfo.title}`
        }]);

        if (!stockUpdateSuccess) return;
        
        const isFulfillingRequest = !!fulfillingRequestId;
        
        const newReport: ProductionReport = {
            id: isFulfillingRequest && fulfillingRequestId 
                ? `PROD-${fulfillingRequestId}` 
                : generateSequentialId('PROD'),
            timestamp: new Date().toISOString(),
            userId: currentUser.uid,
            selectedGarment: selectedGarmentInfo.title,
            hppResult,
            isReceivedInWarehouse: false,
            sourceRequestId: fulfillingRequestId || undefined,
        };
        
        setProductionReports(prev => [newReport, ...prev]);
        addActivity('Produksi', `Membuat laporan produksi ${selectedGarmentInfo.title} #${newReport.id}`, newReport.id);
        
        if (fulfillingRequestId) {
            setProductionRequests(prev => prev.map(req => 
                req.id === fulfillingRequestId 
                    ? { ...req, status: 'completed_production', completedProductionAt: new Date().toISOString() } 
                    : req
            ));
            addActivity('Produksi', `Menyelesaikan permintaan produksi #${fulfillingRequestId}`, fulfillingRequestId);
            setFulfillingRequestId(null);
        }
        
        addToast({ title: 'Produksi Berhasil', message: 'Laporan telah dibuat dan stok material telah dikurangi.', type: 'success' });
        
        setHppResult(null);
    };
    
    const handleApproveRequest = (requestId: string) => {
        setProductionRequests(prev => prev.map(req => 
            req.id === requestId 
                ? { ...req, status: 'approved_by_production', approvedByProductionAt: new Date().toISOString() } 
                : req
        ));
        const request = productionRequests.find(r => r.id === requestId);
        if (request) {
            addActivity('Produksi', `Menyetujui permintaan produksi #${request.id}`, requestId);
        }
        addToast({ title: 'Permintaan Disetujui', message: 'Permintaan telah disetujui dan siap untuk diproduksi.', type: 'success' });
    };

    const handleFulfillRequest = (request: ProductionRequest) => {
        if (!request.items || request.items.length === 0) {
            addToast({ title: 'Error', message: 'Permintaan tidak memiliki item.', type: 'error' });
            return;
        }

        const firstItem = request.items[0];
        const firstProduct = finishedGoods.find(g => g.id === firstItem.productId);
        if (!firstProduct) {
             addToast({ title: 'Error', message: `Produk ${firstItem.productName} tidak ditemukan.`, type: 'error' });
            return;
        }

        const garmentKey = Object.keys(garmentPatterns).find(key => 
            firstProduct.name.toLowerCase().includes(garmentPatterns[key].title.toLowerCase())
        );
        
        if (!garmentKey) {
            addToast({ title: 'Error', message: 'Jenis pakaian tidak dapat ditentukan dari permintaan.', type: 'error' });
            return;
        }

        resetFormForNewGarment(garmentKey);

        const newOrderItems: GarmentOrderItem[] = request.items.map(reqItem => {
            const product = finishedGoods.find(g => g.id === reqItem.productId);
            return {
                id: crypto.randomUUID(),
                model: product?.model || null,
                size: product?.size || '',
                quantity: reqItem.requestedQuantity,
                colorName: product?.colorName || 'Unknown',
                colorCode: product?.colorCode || '#000000',
            };
        });

        setOrder(newOrderItems);
        setFulfillingRequestId(request.id);
        setView('calculator');
        addToast({ title: 'Form Dimuat', message: 'Verifikasi detail produksi dan buat laporan.', type: 'info' });
    };
    
    const itemVariants: Variants = {
        hidden: { opacity: 0, y: -15, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 500, damping: 30 } },
        exit: { opacity: 0, x: -30, transition: { duration: 0.2 } }
    };

    const renderHppCalculator = () => (
        <div>
            {fulfillingRequestId && (
                <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 px-4 py-3 rounded-lg mb-4" role="alert">
                    <p className="font-bold">Memenuhi Permintaan #{fulfillingRequestId}</p>
                    <p className="text-sm">Anda sedang membuat laporan produksi untuk permintaan dari gudang. Harap periksa kembali detail sebelum konfirmasi.</p>
                </div>
            )}
            <h2 className="text-2xl font-semibold text-slate-700 mb-4">Kalkulator HPP & Input Produksi</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
                     <h2 className="text-xl font-bold text-slate-800 border-b pb-2">1. Input Produksi</h2>
                     
                     <div>
                         <label className="block text-sm font-medium text-slate-600 mb-2">Pilih Jenis Pakaian</label>
                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                             {Object.entries(garmentPatterns).map(([key, value]) => {
                                 // FIX: Cast `value` to `GarmentPattern` to access properties `icon` and `title` without TypeScript errors.
                                 const Icon = (value as GarmentPattern).icon;
                                 return (
                                     <button
                                         key={key}
                                         onClick={() => resetFormForNewGarment(key)}
                                         className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all text-center ${selectedGarment === key ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-400 hover:bg-indigo-50/50'}`}
                                     >
                                         <Icon size={24} className="mb-1" />
                                         <span className="text-xs font-semibold">{(value as GarmentPattern).title}</span>
                                     </button>
                                 )
                             })}
                         </div>
                     </div>
                     
                     <div>
                         <label className="block text-sm font-medium text-slate-600 mb-1">Harga Bahan Utama ({materials.find(m => m.id === selectedGarmentInfo.materialId)?.name || ''})</label>
                         <div className="flex">
                             <span className="inline-flex items-center px-3 text-sm text-slate-900 bg-slate-200 border border-r-0 border-slate-300 rounded-l-md">Rp</span>
                             <CustomInput type="text" inputMode="numeric" placeholder="Contoh: 150000" value={materialPrice} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); setMaterialPrice(Number(val)); }} className="rounded-none"/>
                             <CustomSelect value={materialPriceUnit} onChange={e => setMaterialPriceUnit(e.target.value as MaterialPriceUnit)} className="rounded-l-none !w-28">
                                 <option value="kg">/ kg</option>
                                 <option value="meter">/ meter</option>
                                 <option value="rol">/ rol</option>
                             </CustomSelect>
                         </div>
                     </div>

                     {materialPriceUnit === 'rol' && (
                        <div>
                            <CustomInput
                                label={`Isi per Rol (${materials.find(m => m.id === selectedGarmentInfo.materialId)?.unit || 'kg'})`}
                                type="text"
                                inputMode="numeric"
                                value={rollConversion}
                                onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); setRollConversion(Number(val)); }}
                                placeholder="Contoh: 25"
                            />
                            <p className="text-xs text-slate-500 mt-1">Masukkan berapa {materials.find(m => m.id === selectedGarmentInfo.materialId)?.unit || 'kg'} isi dari satu rol bahan.</p>
                        </div>
                    )}
                     
                     <div>
                        <h3 className="font-semibold text-slate-700 mb-2">Detail Pesanan Pakaian</h3>
                        <div className="space-y-2">
                           <AnimatePresence>
                            {order.map((item, index) => {
                                const itemAvailableSizes = Object.keys(sizingStandards[`${selectedGarment}-${item.model?.replace(/\s+/g, '-')}`] || sizingStandards[selectedGarment] || {});
                                return (
                                <motion.div 
                                    key={item.id} 
                                    variants={itemVariants} 
                                    initial="hidden" 
                                    animate="visible" 
                                    exit="exit" 
                                    layout 
                                    className="flex flex-col gap-3 p-3 bg-slate-50/70 rounded-lg border border-slate-200"
                                >
                                    <div className="grid grid-cols-12 gap-2 items-end">
                                        {selectedGarmentInfo.models.length > 0 ? (
                                            <>
                                                <div className="col-span-5">
                                                    <CustomSelect label={index === 0 ? 'Model' : ''} value={item.model || ''} onChange={e => handleOrderChange(item.id, 'model', e.target.value)}>
                                                        {selectedGarmentInfo.models.map(m => <option key={m} value={m}>{m}</option>)}
                                                    </CustomSelect>
                                                </div>
                                                <div className="col-span-3">
                                                    <CustomSelect label={index === 0 ? 'Ukuran' : ''} value={item.size} onChange={e => handleOrderChange(item.id, 'size', e.target.value)}>
                                                        {itemAvailableSizes.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </CustomSelect>
                                                </div>
                                                <div className="col-span-3">
                                                    <CustomInput label={index === 0 ? 'Jumlah' : ''} type="text" inputMode="numeric" value={item.quantity} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); handleOrderChange(item.id, 'quantity', Number(val) || 0); }} />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="col-span-5">
                                                    <CustomSelect label={index === 0 ? 'Ukuran' : ''} value={item.size} onChange={e => handleOrderChange(item.id, 'size', e.target.value)}>
                                                        {itemAvailableSizes.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </CustomSelect>
                                                </div>
                                                <div className="col-span-6">
                                                    <CustomInput label={index === 0 ? 'Jumlah' : ''} type="text" inputMode="numeric" value={item.quantity} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); handleOrderChange(item.id, 'quantity', Number(val) || 0); }} />
                                                </div>
                                            </>
                                        )}
                                        <div className="col-span-1 flex justify-end">
                                            <Button variant="ghost" size="sm" className="!p-2 text-slate-400 hover:text-red-500 hover:bg-red-50" onClick={() => removeOrderItem(item.id)}>
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-12 gap-2 items-end">
                                        <div className="col-span-5">
                                            <CustomInput label={index === 0 ? 'Warna' : ''} placeholder="Nama Warna" value={item.colorName} onChange={e => handleOrderChange(item.id, 'colorName', e.target.value)} />
                                        </div>
                                        <div className="col-span-7 flex items-center gap-2 pt-5">
                                            <CustomInput 
                                                type="color" 
                                                className="p-1 h-10 w-12 shrink-0"
                                                value={item.colorCode} 
                                                onChange={e => handleOrderChange(item.id, 'colorCode', e.target.value)} 
                                                aria-label="Color Picker"
                                            />
                                            <CustomInput 
                                                type="text" 
                                                className="text-sm font-mono flex-grow"
                                                placeholder="#000000" 
                                                value={item.colorCode} 
                                                onChange={e => handleOrderChange(item.id, 'colorCode', e.target.value)} 
                                                aria-label="Hex Color Code"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )})}
                           </AnimatePresence>
                        </div>
                        <Button variant="outline" size="sm" onClick={addOrderItem} className="mt-2"><Plus size={16}/> Tambah Baris Pesanan</Button>
                     </div>

                    {!['kepala_gudang'].includes(currentUser.role) && (
                         <div>
                            <h3 className="font-semibold text-slate-700 mb-2">Biaya Tambahan (per Pcs)</h3>
                             <div className="space-y-2">
                                <AnimatePresence>
                                    {additionalCosts.map(item => (
                                        <motion.div key={item.id} variants={itemVariants} initial="hidden" animate="visible" exit="exit" layout className="flex gap-2 items-end">
                                            <CustomInput placeholder="Nama Biaya (cth: Sablon)" value={item.name} onChange={e => handleCostChange(item.id, 'name', e.target.value)} />
                                            <CustomInput type="text" inputMode="numeric" placeholder="Biaya" value={item.cost} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); handleCostChange(item.id, 'cost', Number(val) || 0); }} />
                                            <Button variant="ghost" size="sm" className="!p-2 text-slate-400 hover:text-red-500 hover:bg-red-50" onClick={() => removeAdditionalCost(item.id)}><Trash2 size={16} /></Button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                             </div>
                             <Button variant="outline" size="sm" onClick={addAdditionalCost} className="mt-2"><Plus size={16}/> Tambah Biaya</Button>
                         </div>
                     )}

                     {['super_admin', 'admin'].includes(currentUser.role) && (
                        <div>
                            <h3 className="font-semibold text-slate-700 mb-2">Penentuan Harga Jual</h3>
                            <CustomInput 
                                label="Margin Profit (%)"
                                type="text"
                                inputMode="numeric"
                                value={profitMargin}
                                onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); setProfitMargin(Number(val)); }}
                                placeholder="Contoh: 70"
                            />
                        </div>
                     )}
                     
                     <Button onClick={calculateHPP} className="w-full !mt-8"><Calculator size={18} /> Hitung HPP</Button>
                </div>

                <AnimatePresence>
                {hppResult && (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="bg-white p-6 rounded-xl shadow-md space-y-4 self-start"
                    >
                        <h2 className="text-xl font-bold text-slate-800 border-b pb-2">2. Hasil Kalkulasi</h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-slate-500">Total Pakaian Produksi:</span> <strong className="text-slate-800">{hppResult.garmentsProduced} pcs</strong></div>
                            <div className="flex justify-between"><span className="text-slate-500">Konsumsi Bahan Utama:</span> <strong className="text-slate-800">{hppResult.materialConsumption[0].quantity.toFixed(2)} {hppResult.materialConsumption[0].unit}</strong></div>
                            <div className="border-t my-2"></div>
                            <div className="flex justify-between"><span className="text-slate-500">Total Biaya Bahan:</span> <strong className="text-slate-800">{formatCurrency(hppResult.totalMaterialCost)}</strong></div>
                            <div className="flex justify-between"><span className="text-slate-500">Total Biaya Tambahan:</span> <strong className="text-slate-800">{formatCurrency(hppResult.totalAdditionalCost)}</strong></div>
                            {['super_admin', 'admin', 'kepala_produksi', 'member', 'kepala_gudang'].includes(currentUser.role) && (
                                <div className="flex justify-between pt-1 mt-1 border-t"><span className="text-slate-500 font-medium">HPP per Pakaian:</span> <strong className="text-slate-800 font-medium">{formatCurrency(hppResult.hppPerGarment)}</strong></div>
                            )}
                        </div>

                        <div className="bg-indigo-50 p-3 rounded-lg text-center mt-4">
                            <p className="text-sm font-medium text-indigo-800">Total Biaya Produksi</p>
                            <p className="text-2xl font-bold text-indigo-700">{formatCurrency(hppResult.totalProductionCost)}</p>
                        </div>

                        {['super_admin', 'admin'].includes(currentUser.role) && (
                            <div className="bg-green-50 p-4 rounded-lg text-center mt-4">
                                <p className="text-sm font-medium text-green-800">Rekomendasi Harga Jual</p>
                                <p className="text-2xl font-bold text-green-700">{formatCurrency(hppResult.sellingPricePerGarment)} / pcs</p>
                                <p className="text-xs text-green-600 mt-1">Margin Profit: {profitMargin}%</p>
                            </div>
                        )}
                        
                        <div className="mt-6 pt-4 border-t">
                            <h3 className="text-base font-bold text-slate-700 mb-2 flex items-center"><BarChart3 size={18} className="mr-2 text-indigo-600"/> Grafik Kebutuhan Bahan</h3>
                            <div className="h-48">
                                <ChartComponent
                                    type="bar"
                                    data={{
                                        labels: hppResult.materialConsumption.map(m => m.name),
                                        datasets: [{
                                            label: `Kebutuhan (${hppResult.materialConsumption[0]?.unit})`,
                                            data: hppResult.materialConsumption.map(m => parseFloat(m.quantity.toFixed(2))),
                                            backgroundColor: 'rgba(79, 70, 229, 0.6)',
                                            borderColor: 'rgba(79, 70, 229, 1)',
                                            borderWidth: 1,
                                        }]
                                    }}
                                    options={{
                                        indexAxis: 'y',
                                        scales: {
                                            x: {
                                                beginAtZero: true,
                                                title: { display: true, text: `Jumlah (${hppResult.materialConsumption[0]?.unit})` }
                                            }
                                        },
                                        plugins: { legend: { display: false } }
                                    }}
                                />
                            </div>
                        </div>

                        <Button onClick={confirmProduction} className="w-full mt-6"><Check size={18}/> {fulfillingRequestId ? 'Simpan Laporan Produksi' : 'Konfirmasi & Mulai Produksi'}</Button>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
        </div>
    );
    
    const renderWarehouseRequests = () => {
        const getStatusBadge = (status: ProductionRequestStatus) => {
            const styles: { [key: string]: string } = {
                'approved_by_production': 'bg-blue-100 text-blue-800', 'completed_production': 'bg-green-100 text-green-800', 'rejected': 'bg-red-100 text-red-800', 'approved_by_warehouse': 'bg-teal-100 text-teal-800',
            };
            const text: { [key: string]: string } = {
                'approved_by_production': 'Disetujui', 'completed_production': 'Selesai Produksi', 'rejected': 'Ditolak', 'approved_by_warehouse': 'Diterima Gudang',
            };
            return <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${styles[status]}`}>{text[status]}</span>
        };
        
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-slate-700">Permintaan Produksi dari Gudang</h2>
                
                <Card>
                    <h3 className="font-bold text-slate-800 flex items-center mb-2"><Inbox size={20} className="mr-2 text-yellow-500"/> Permintaan Baru</h3>
                     {pendingRequests.length > 0 ? (
                        <div className="space-y-4">
                            {pendingRequests.map(req => <RequestCard key={req.id} request={req} users={users} onApproveRequest={handleApproveRequest} onFulfillRequest={handleFulfillRequest} />)}
                        </div>
                    ) : <p className="text-slate-500 text-sm">Tidak ada permintaan baru.</p>}
                </Card>

                <Card>
                    <h3 className="font-bold text-slate-800 flex items-center mb-2"><Wrench size={20} className="mr-2 text-blue-500"/> Sedang Dikerjakan</h3>
                     {approvedRequests.length > 0 ? (
                        <div className="space-y-4">
                            {approvedRequests.map(req => <RequestCard key={req.id} request={req} users={users} onApproveRequest={handleApproveRequest} onFulfillRequest={handleFulfillRequest} />)}
                        </div>
                    ) : <p className="text-slate-500 text-sm">Tidak ada permintaan yang sedang dikerjakan.</p>}
                </Card>

                <Card>
                    <h3 className="font-bold text-slate-800 flex items-center mb-2"><History size={20} className="mr-2 text-slate-500"/> Riwayat</h3>
                     {otherRequests.length > 0 ? (
                        <div className="space-y-4">
                             {otherRequests.map(req => (
                                <motion.div key={req.id} layout initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-white p-4 rounded-xl shadow-md border opacity-80">
                                   <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md inline-block mb-2">{req.id}</p>
                                            {req.items.map((item, index) => (
                                                <div key={index} className={index > 0 ? "mt-2 pt-2 border-t" : ""}>
                                                    <p className="font-bold text-lg text-slate-600">{item.productName}</p>
                                                    <p className="text-xl font-bold text-slate-700">{item.requestedQuantity} pcs</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1">
                                             {getStatusBadge(req.status)}
                                             <p className="text-xs text-slate-500">{formatDate(req.timestamp)}</p>
                                        </div>
                                    </div>
                                     <p className="text-sm text-slate-500 mt-2 pt-2 border-t"><strong>Catatan:</strong> {req.notes || '-'}</p>
                                </motion.div>
                            ))}
                        </div>
                    ) : <p className="text-slate-500 text-sm">Belum ada riwayat permintaan.</p>}
                </Card>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Manajemen Produksi</h1>
            
            <div className="bg-white p-2 rounded-xl shadow-md flex gap-2">
                <Button variant={view === 'calculator' ? 'primary' : 'ghost'} onClick={() => setView('calculator')} className="flex-1">
                    Kalkulator HPP
                </Button>
                <Button variant={view === 'requests' ? 'primary' : 'ghost'} onClick={() => setView('requests')} className="flex-1 relative">
                    Permintaan Gudang
                    {pendingRequestsCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">{pendingRequestsCount}</span>
                    )}
                </Button>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={view} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                    {view === 'calculator' ? renderHppCalculator() : renderWarehouseRequests()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};