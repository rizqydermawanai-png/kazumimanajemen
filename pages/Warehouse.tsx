// pages/Warehouse.tsx
import React, { useState, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { CustomInput } from '../components/ui/CustomInput';
import { CustomSelect } from '../components/ui/CustomSelect';
import { useToast } from '../hooks/useToast';
import { formatCurrency, formatDate, getUsernameById, generateSequentialId } from '../lib/utils';
import type { UserData, Material, ProductionReport, FinishedGood, OnlineOrder, StockHistoryEntry, StockHistoryType, OnlineOrderStatus, StockAdjustment, ProductionRequest, ProductionRequestStatus, ProductionRequestItem, StockAdjustmentItem, Address, GarmentPattern } from '../types';
import { Plus, Check, Truck, X, Printer, Edit,ThumbsUp, ThumbsDown, Trash2, AlertTriangle, AlertCircle, PackageCheck, PlusCircle, Send, Package, CheckCircle2, Wallet, Eye } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
// FIX: Correct the import path for usePrintPreview.
import { usePrintPreview } from '../components/PrintProvider';
import { printStockChecklist } from '../lib/print';
// FIX: Import the Card component.
import { Card } from '../components/ui/Card';
import { useAppContext } from '../context/AppContext';


interface WarehousePageProps {
    materials: Material[];
    setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
    addActivity: (type: string, description: string, relatedId?: string) => void;
    productionReports: ProductionReport[];
    setProductionReports: React.Dispatch<React.SetStateAction<ProductionReport[]>>;
    finishedGoods: FinishedGood[];
    setFinishedGoods: React.Dispatch<React.SetStateAction<FinishedGood[]>>;
    onlineOrders: OnlineOrder[];
    stockHistory: StockHistoryEntry[];
    updateStock: (updates: { itemId: string, quantityChange: number, type: StockHistoryType, notes: string }[]) => boolean;
    currentUser: UserData;
    addStockHistory: (itemId: string, itemName: string, type: StockHistoryType, quantityChange: number, finalStock: number, notes: string) => void;
    receiveProductionGoods: (report: ProductionReport) => void;
    stockAdjustments: StockAdjustment[];
    setStockAdjustments: React.Dispatch<React.SetStateAction<StockAdjustment[]>>;
    productionRequests: ProductionRequest[];
    setProductionRequests: React.Dispatch<React.SetStateAction<ProductionRequest[]>>;
    onDispatchOrder: (order: OnlineOrder, trackingNumber: string) => void;
    onApprovePayment: (orderId: string) => void;
    garmentPatterns: { [key: string]: GarmentPattern };
}

type WarehouseView = 'online_orders' | 'materials' | 'finished' | 'requests' | 'verification' | 'history';
type AdjustmentType = 'material' | 'finishedGood';

// New component for stock status indicator
const StockStatusIndicator = ({ stock, threshold }: { stock: number; threshold: number }) => {
    const lowStockThreshold = threshold;
    
    let status: { color: string; text: string };

    if (stock === 0) {
        status = { color: 'bg-red-500', text: 'Stok Habis' };
    } else if (stock <= lowStockThreshold) {
        status = { color: 'bg-yellow-400', text: 'Stok Menipis' };
    } else {
        status = { color: 'bg-green-500', text: 'Stok Aman' };
    }

    return (
        <div className="flex items-center gap-2">
            <span>{stock}</span>
            <span 
                className={`w-2.5 h-2.5 rounded-full ring-2 ring-offset-1 ring-transparent ${status.color}`} 
                title={status.text}
            ></span>
        </div>
    );
};


export const WarehousePage = ({ 
    materials, setMaterials, addActivity, productionReports, finishedGoods, setFinishedGoods, onlineOrders, 
    stockHistory, updateStock, addStockHistory, receiveProductionGoods,
    stockAdjustments, setStockAdjustments, currentUser, users, productionRequests, setProductionRequests, onDispatchOrder, onApprovePayment,
    garmentPatterns
}: WarehousePageProps & { users: UserData[] }) => {
    const { state, dispatch } = useAppContext();
    const { stockThresholds } = state;
    const [view, setView] = useState<WarehouseView>('online_orders');
    const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
    const [editingGood, setEditingGood] = useState<FinishedGood | null>(null);
    const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
    
    const initialGarmentKey = Object.keys(garmentPatterns)[0];
    const initialGarment = initialGarmentKey ? garmentPatterns[initialGarmentKey] : null;

    const [quickAddForm, setQuickAddForm] = useState({
        name: initialGarment?.title || 'Kaos',
        model: initialGarment?.models[0] || 'Regular',
        size: 'M',
        colorName: 'Hitam',
        colorCode: '#000000',
        stock: 1,
        hpp: 75000,
        sellingPrice: 150000,
        weight: initialGarment?.defaultWeight || 250,
    });
    
    const [adjustmentDetails, setAdjustmentDetails] = useState<{
        type: AdjustmentType | null,
        items: { id: string; itemId: string; quantity: number; action: 'add' | 'subtract' }[],
        notes: string
    }>({ type: null, items: [], notes: '' });
    
    const [newMaterial, setNewMaterial] = useState({ name: '', unit: 'kg', stock: 0, pricePerUnit: 0 });
    const { addToast } = useToast();
    const { showPrintPreview } = usePrintPreview();
    const isSuperAdmin = currentUser.role === 'super_admin';
    
    const notificationCounts = useMemo(() => ({
        online_orders: onlineOrders.filter(o => o.status === 'pending_payment' || o.status === 'pending_gudang' || o.status === 'pending_dp').length,
        finished: productionReports.filter(r => !r.isReceivedInWarehouse).length,
        verification: stockAdjustments.filter(adj => adj.status === 'pending').length,
    }), [onlineOrders, productionReports, stockAdjustments]);

    const handleAddMaterial = () => {
        if (!newMaterial.name || !newMaterial.unit || newMaterial.stock < 0 || newMaterial.pricePerUnit < 0) {
            addToast({ title: 'Error', message: 'Harap isi semua field dengan benar.', type: 'error' });
            return;
        }

        const materialToAdd: Material = { id: `mat-${crypto.randomUUID()}`, ...newMaterial };
        setMaterials(prev => [...prev, materialToAdd]);
        addStockHistory(materialToAdd.id, materialToAdd.name, 'initial', materialToAdd.stock, materialToAdd.stock, 'Stok awal material baru');
        addActivity('Gudang', `Menambah material baru: ${materialToAdd.name}`, materialToAdd.id);
        addToast({ title: 'Berhasil', message: 'Material baru telah ditambahkan.', type: 'success' });
        setIsMaterialModalOpen(false);
        setNewMaterial({ name: '', unit: 'kg', stock: 0, pricePerUnit: 0 });
    };

    const handleQuickAddFormChange = (field: string, value: any) => {
        setQuickAddForm(prev => {
            const newState = { ...prev, [field]: value };
            if (field === 'name') {
                // When garment type changes, reset the model to the first available one.
                const newGarmentKey = Object.keys(garmentPatterns).find(key => garmentPatterns[key].title === value);
                const newGarment = newGarmentKey ? garmentPatterns[newGarmentKey] : null;
                const newModels = newGarment ? newGarment.models : [];
                newState.model = newModels[0] || '';
                newState.weight = newGarment?.defaultWeight || 250;
            }
            return newState;
        });
    };

    const handleQuickAddProduct = () => {
        if (!quickAddForm.name || !quickAddForm.size || !quickAddForm.colorName || quickAddForm.stock <= 0 || quickAddForm.hpp <= 0 || quickAddForm.sellingPrice <= 0) {
            addToast({ title: 'Data Tidak Lengkap', message: 'Harap isi semua field dengan nilai yang valid.', type: 'error' });
            return;
        }

        const newFinishedGood: FinishedGood = {
            id: generateSequentialId('FG'),
            productionReportId: 'MANUAL_INPUT',
            name: quickAddForm.name,
            model: quickAddForm.model,
            size: quickAddForm.size,
            colorName: quickAddForm.colorName,
            colorCode: quickAddForm.colorCode,
            stock: Number(quickAddForm.stock),
            hpp: Number(quickAddForm.hpp),
            sellingPrice: Number(quickAddForm.sellingPrice),
            imageUrls: [],
            weight: Number(quickAddForm.weight),
        };

        setFinishedGoods(prev => [newFinishedGood, ...prev]);
        addStockHistory(
            newFinishedGood.id,
            `${newFinishedGood.name} ${newFinishedGood.size} (${newFinishedGood.colorName})`,
            'initial',
            newFinishedGood.stock,
            newFinishedGood.stock,
            'Stok awal dari Tambah Produk Cepat'
        );
        addActivity('Gudang', `Menambah produk jadi baru secara manual: ${newFinishedGood.name} ${newFinishedGood.size}`, newFinishedGood.id);
        
        addToast({ title: 'Produk Ditambahkan', message: 'Produk baru telah berhasil ditambahkan ke stok.', type: 'success' });
        setIsQuickAddModalOpen(false);
        setQuickAddForm({
            name: initialGarment?.title || 'Kaos',
            model: initialGarment?.models[0] || 'Regular',
            size: 'M',
            colorName: 'Hitam',
            colorCode: '#000000',
            stock: 1,
            hpp: 75000,
            sellingPrice: 150000,
            weight: initialGarment?.defaultWeight || 250,
        });
    };

    const openAdjustmentModal = (type: AdjustmentType) => {
        setAdjustmentDetails({ type, items: [{ id: crypto.randomUUID(), itemId: '', quantity: 1, action: 'add' }], notes: '' });
        setIsAdjustmentModalOpen(true);
    };

    const handleAdjustmentItemChange = (id: string, field: 'itemId' | 'quantity' | 'action', value: string | number) => {
        setAdjustmentDetails(prev => ({
            ...prev,
            items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
        }));
    };
    
    const addAdjustmentItem = () => {
        setAdjustmentDetails(prev => ({
            ...prev,
            items: [...prev.items, { id: crypto.randomUUID(), itemId: '', quantity: 1, action: 'add' }]
        }));
    };

    const removeAdjustmentItem = (id: string) => {
        setAdjustmentDetails(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== id)
        }));
    };

    const handleRequestAdjustment = () => {
        const { type, items, notes } = adjustmentDetails;
        const validItems = items.filter(i => i.itemId && i.quantity > 0);
        
        if (!type || validItems.length === 0 || !notes.trim()) {
            addToast({ title: 'Error', message: 'Harap lengkapi semua field, termasuk item dan alasan.', type: 'error' });
            return;
        }
        
        const itemsForRequest: StockAdjustmentItem[] = validItems.map(item => {
            const product = type === 'material' 
                ? materials.find(m => m.id === item.itemId) 
                : finishedGoods.find(g => g.id === item.itemId);
            
            if (!product) return null; 

            const itemName = 'size' in product && 'colorName' in product 
                ? `${product.name} ${product.size} (${product.colorName})` 
                : product.name;
            
            return {
                itemId: item.itemId,
                itemName: itemName,
                itemType: type,
                quantityChange: item.action === 'add' ? item.quantity : -item.quantity,
            };
        }).filter((item): item is StockAdjustmentItem => item !== null);

        if(itemsForRequest.length === 0) {
             addToast({ title: 'Error', message: 'Item yang dipilih tidak valid.', type: 'error' });
             return;
        }

        const newAdjustment: StockAdjustment = {
            id: generateSequentialId('ADJ'),
            timestamp: new Date().toISOString(),
            requestedBy: currentUser.uid,
            items: itemsForRequest,
            notes,
            status: 'pending'
        };

        setStockAdjustments(prev => [newAdjustment, ...prev]);
        addActivity('Gudang', `Mengajukan penyesuaian stok manual #${newAdjustment.id}`, newAdjustment.id);
        addToast({ title: 'Pengajuan Terkirim', message: 'Permintaan penyesuaian stok Anda telah dikirim untuk verifikasi.', type: 'success' });
        setIsAdjustmentModalOpen(false);
    };
    
    const handleReviewAdjustment = (id: string, decision: 'approve' | 'reject') => {
        const adjustment = stockAdjustments.find(a => a.id === id);
        if (!adjustment) return;
        
        const isApproved = decision === 'approve';
        
        if (isApproved) {
            const stockUpdates = adjustment.items.map(item => ({
                itemId: item.itemId,
                quantityChange: item.quantityChange,
                type: 'adjustment' as StockHistoryType,
                notes: `Penyesuaian manual: ${adjustment.notes}`
            }));
            
            const stockUpdateSuccess = updateStock(stockUpdates);

            if (!stockUpdateSuccess) {
                return;
            }
        }

        setStockAdjustments(prev => prev.map(a => a.id === id ? {
            ...a,
            status: isApproved ? 'approved' : 'rejected',
            reviewedBy: currentUser.uid,
            reviewedAt: new Date().toISOString()
        } : a));
        
        const itemNames = adjustment.items.map(i => i.itemName).join(', ');
        addActivity('Gudang', `${isApproved ? 'Menyetujui' : 'Menolak'} penyesuaian stok untuk: ${itemNames}`, id);
        addToast({ title: 'Berhasil', message: `Penyesuaian stok telah ${isApproved ? 'disetujui' : 'ditolak'}.`, type: 'success' });
    };

    const handleReceiveFromProduction = (report: ProductionReport) => receiveProductionGoods(report);
    
    const handleUpdateOrderStatus = (orderId: string, status: OnlineOrderStatus, assigneeId?: string, estimatedCompletionDate?: string) => {
        dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, status, assigneeId, estimatedCompletionDate } });
        if (status === 'approved_gudang') {
            addToast({ title: 'Pesanan Diproses', message: 'Anda telah mulai menyiapkan pesanan ini.', type: 'success' });
        }
    };


    const handlePrintMaterialChecklist = () => printStockChecklist(materials, 'Form Stok Opname - Material Mentah', showPrintPreview);
    const handlePrintFinishedGoodsChecklist = () => {
        const formattedGoods = finishedGoods.map(g => ({ ...g, name: `${g.name} ${g.size} (${g.colorName})` }));
        printStockChecklist(formattedGoods, 'Form Stok Opname - Barang Jadi', showPrintPreview);
    };

    const handleOpenEditModal = (good: FinishedGood) => setEditingGood({ ...good });
    const handleCloseEditModal = () => setEditingGood(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        if (!e.target.files || !editingGood) return;
        const file = e.target.files[0];
        if (file.size > 1024 * 1024) { // 1MB limit
            addToast({ title: 'Error', message: 'Ukuran file gambar tidak boleh lebih dari 1MB.', type: 'error' });
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                setEditingGood(prev => {
                    if (!prev) return null;
                    const newImageUrls = [...(prev.imageUrls || [])];
                    newImageUrls[index] = reader.result as string;
                    return { ...prev, imageUrls: newImageUrls };
                });
                addToast({ title: 'Gambar Siap', message: 'Klik "Simpan" untuk menerapkan gambar.', type: 'info' });
            }
        };
        reader.readAsDataURL(file);
    };
    
    const handleSaveGoodChanges = () => {
        if (!editingGood) return;
        setFinishedGoods(prevGoods => 
            prevGoods.map(good => 
                good.id === editingGood.id ? editingGood : good
            )
        );
        addActivity('Gudang', `Memperbarui gambar untuk produk: ${editingGood.name} ${editingGood.size}`, editingGood.id);
        addToast({ title: 'Berhasil', message: 'Gambar produk telah diperbarui.', type: 'success' });
        handleCloseEditModal();
    };


    const renderContent = () => {
        switch(view) {
            case 'materials': return <MaterialsView materials={materials} onAddClick={() => setIsMaterialModalOpen(true)} onPrintChecklist={handlePrintMaterialChecklist} onAdjustClick={() => openAdjustmentModal('material')} threshold={stockThresholds.materials} />;
            case 'finished': return <FinishedGoodsView reports={productionReports.filter(r => !r.isReceivedInWarehouse)} finishedGoods={finishedGoods} onReceive={handleReceiveFromProduction} onPrintChecklist={handlePrintFinishedGoodsChecklist} onAdjustClick={() => openAdjustmentModal('finishedGood')} currentUser={currentUser} onEditClick={handleOpenEditModal} threshold={stockThresholds.finishedGoods} onQuickAddClick={() => setIsQuickAddModalOpen(true)} />;
            case 'requests': return <ProductionRequestView finishedGoods={finishedGoods} currentUser={currentUser} addActivity={addActivity} setProductionRequests={setProductionRequests} productionRequests={productionRequests} users={users} threshold={stockThresholds.finishedGoods} />;
            case 'verification': return isSuperAdmin ? <VerificationView adjustments={stockAdjustments} onReview={handleReviewAdjustment} users={users} /> : null;
            case 'online_orders': return <OnlineOrdersView orders={onlineOrders} onApprovePayment={onApprovePayment} onUpdateStatus={handleUpdateOrderStatus} onDispatchOrder={onDispatchOrder} currentUser={currentUser} users={users} />;
            case 'history': return <StockHistoryView history={stockHistory} />;
            default: return null;
        }
    };
    
    const warehouseViews: { key: WarehouseView; label: string; roles: string[] }[] = [
        { key: 'online_orders', label: 'Pesanan Online', roles: ['super_admin', 'admin', 'kepala_gudang', 'member'] },
        { key: 'materials', label: 'Material Mentah', roles: ['super_admin', 'admin', 'kepala_gudang', 'member'] },
        { key: 'finished', label: 'Barang Jadi', roles: ['super_admin', 'admin', 'kepala_gudang', 'member'] },
        { key: 'requests', label: 'Permintaan Produksi', roles: ['super_admin', 'admin', 'kepala_gudang', 'member'] },
        { key: 'verification', label: 'Verifikasi Stok', roles: ['super_admin'] },
        { key: 'history', label: 'Riwayat Stok', roles: ['super_admin', 'admin', 'kepala_gudang', 'member'] },
    ];

    const selectedGarmentKey = Object.keys(garmentPatterns).find(key => garmentPatterns[key].title === quickAddForm.name);
    const availableModels = selectedGarmentKey ? garmentPatterns[selectedGarmentKey].models : [];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Manajemen Gudang</h1>

            <div className="bg-white p-2 rounded-xl shadow-md flex gap-2 flex-wrap">
                {warehouseViews.filter(v => v.roles.includes(currentUser.role)).map(v => {
                    const countMap: Record<string, number> = {
                        online_orders: notificationCounts.online_orders,
                        finished: notificationCounts.finished,
                        verification: notificationCounts.verification,
                    };
                    const count = countMap[v.key] || 0;
                    return (
                        <Button key={v.key} variant={view === v.key ? 'primary' : 'ghost'} onClick={() => setView(v.key as WarehouseView)} className="flex-1 relative">
                            {v.label}
                            {count > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                                    {count > 9 ? '9+' : count}
                                </span>
                            )}
                        </Button>
                    );
                })}
            </div>
            
            <AnimatePresence mode="wait">
                <motion.div key={view} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                    {renderContent()}
                </motion.div>
            </AnimatePresence>

            <Modal isOpen={isMaterialModalOpen} onClose={() => setIsMaterialModalOpen(false)} title="Tambah Material Baru">
                 <div className="space-y-4">
                     <CustomInput label="Nama Material" value={newMaterial.name} onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} />
                     <CustomInput label="Satuan" value={newMaterial.unit} onChange={e => setNewMaterial({...newMaterial, unit: e.target.value})} />
                     <CustomInput label="Stok Awal" type="number" value={newMaterial.stock} onChange={e => setNewMaterial({...newMaterial, stock: parseInt(e.target.value) || 0})} />
                     <CustomInput label="Harga per Satuan" type="number" value={newMaterial.pricePerUnit} onChange={e => setNewMaterial({...newMaterial, pricePerUnit: parseInt(e.target.value) || 0})} />
                     <div className="flex justify-end gap-2 pt-4"><Button variant="secondary" onClick={() => setIsMaterialModalOpen(false)}>Batal</Button><Button onClick={handleAddMaterial}>Simpan</Button></div>
                 </div>
            </Modal>

            <Modal isOpen={isQuickAddModalOpen} onClose={() => setIsQuickAddModalOpen(false)} title="Tambah Produk Jadi Cepat">
                <div className="space-y-4">
                    <CustomSelect label="Jenis Produk" value={quickAddForm.name} onChange={e => handleQuickAddFormChange('name', e.target.value)}>
                        {Object.values(garmentPatterns).map(pattern => (
                            <option key={pattern.title} value={pattern.title}>{pattern.title}</option>
                        ))}
                    </CustomSelect>
                    
                    <CustomSelect label="Model" value={quickAddForm.model} onChange={e => handleQuickAddFormChange('model', e.target.value)} disabled={!availableModels || availableModels.length === 0}>
                        {availableModels.length > 0 ? (
                            availableModels.map(model => <option key={model} value={model}>{model}</option>)
                        ) : (
                            <option value="">-- Pilih Jenis Dulu --</option>
                        )}
                    </CustomSelect>

                    <CustomSelect label="Ukuran" value={quickAddForm.size} onChange={e => handleQuickAddFormChange('size', e.target.value)}>
                        <option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option>
                    </CustomSelect>
                    <div className="grid grid-cols-3 gap-4 items-end">
                        <div className="col-span-2">
                            <CustomInput label="Nama Warna" value={quickAddForm.colorName} onChange={e => handleQuickAddFormChange('colorName', e.target.value)}/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Kode</label>
                            <CustomInput type="color" className="p-1 h-10 w-full" value={quickAddForm.colorCode} onChange={e => handleQuickAddFormChange('colorCode', e.target.value)}/>
                        </div>
                    </div>
                    <CustomInput label="Stok Awal" type="number" value={quickAddForm.stock} onChange={e => handleQuickAddFormChange('stock', Number(e.target.value))}/>
                    <CustomInput label="Harga Pokok (HPP) per Pcs" type="number" value={quickAddForm.hpp} onChange={e => handleQuickAddFormChange('hpp', Number(e.target.value))}/>
                    <CustomInput label="Harga Jual per Pcs" type="number" value={quickAddForm.sellingPrice} onChange={e => handleQuickAddFormChange('sellingPrice', Number(e.target.value))}/>
                    <CustomInput label="Berat (gram)" type="number" value={quickAddForm.weight} onChange={e => handleQuickAddFormChange('weight', Number(e.target.value))}/>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="secondary" onClick={() => setIsQuickAddModalOpen(false)}>Batal</Button>
                        <Button onClick={handleQuickAddProduct}>Simpan Produk</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!editingGood} onClose={handleCloseEditModal} title="Edit Gambar Produk">
                {editingGood && (
                    <div className="space-y-4">
                        <div className="p-3 bg-slate-50 rounded-lg text-sm">
                            <p><strong>Produk:</strong> {editingGood.name} {editingGood.size} ({editingGood.colorName})</p>
                            <p><strong>Harga Jual:</strong> {formatCurrency(editingGood.sellingPrice)}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[0, 1, 2].map(index => (
                                <div key={index} className="space-y-2">
                                <img
                                    src={editingGood.imageUrls?.[index] || `https://placehold.co/150x150/e2e8f0/64748b?text=Slot+${index + 1}`}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-32 rounded-lg object-cover bg-slate-100"
                                />
                                <input
                                    type="file"
                                    id={`imageUpload-${index}`}
                                    className="hidden"
                                    accept="image/png, image/jpeg, image/webp"
                                    onChange={(e) => handleImageUpload(e, index)}
                                />
                                <Button variant="outline" type="button" className="w-full" onClick={() => document.getElementById(`imageUpload-${index}`)?.click()}>
                                    Unggah Slot {index + 1}
                                </Button>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500 text-center">Ukuran file gambar tidak boleh lebih dari 1MB.</p>
                        
                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button variant="secondary" onClick={handleCloseEditModal}>Batal</Button>
                            <Button onClick={handleSaveGoodChanges}>Simpan Gambar</Button>
                        </div>
                    </div>
                )}
            </Modal>
            
            <Modal isOpen={isAdjustmentModalOpen} onClose={() => setIsAdjustmentModalOpen(false)} title="Buat Penyesuaian Stok Manual">
                 <div className="space-y-4">
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        <AnimatePresence>
                            {adjustmentDetails.items.map((item, index) => (
                                <motion.div key={item.id} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="p-2 bg-slate-50 rounded-lg space-y-2">
                                    <CustomSelect 
                                        label={index === 0 ? 'Pilih Item' : ''} 
                                        value={item.itemId} 
                                        onChange={e => handleAdjustmentItemChange(item.id, 'itemId', e.target.value)}
                                    >
                                        <option value="">-- Pilih Item --</option>
                                        {adjustmentDetails.type === 'material' 
                                            ? materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>) 
                                            : finishedGoods.map(g => <option key={g.id} value={g.id}>{`${g.name} ${g.size} (${g.colorName})`}</option>)}
                                    </CustomSelect>
                                    <div className="grid grid-cols-3 gap-2">
                                        <CustomSelect 
                                            className="col-span-1"
                                            value={item.action} 
                                            onChange={e => handleAdjustmentItemChange(item.id, 'action', e.target.value)}
                                        >
                                            <option value="add">Masuk</option>
                                            <option value="subtract">Keluar</option>
                                        </CustomSelect>
                                        <CustomInput 
                                            className="col-span-1"
                                            type="number" min="1" 
                                            value={item.quantity} 
                                            onChange={e => handleAdjustmentItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)} 
                                        />
                                        <div className="col-span-1 flex justify-end items-center">
                                            {adjustmentDetails.items.length > 1 && <Button variant="ghost" size="sm" className="!p-2 text-slate-400 hover:text-red-500 hover:bg-red-50" onClick={() => removeAdjustmentItem(item.id)}><Trash2 size={16} /></Button>}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                    <Button variant="outline" size="sm" onClick={addAdjustmentItem}><Plus size={16}/> Tambah Item</Button>

                    <div className="pt-2">
                        <label className="block text-sm font-medium text-slate-600 mb-1">Alasan Penyesuaian</label>
                        <textarea value={adjustmentDetails.notes} onChange={e => setAdjustmentDetails(prev => ({...prev, notes: e.target.value}))} rows={3} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Contoh: Hasil Stok Opname 2024, Barang Rusak, dll."/>
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="secondary" onClick={() => setIsAdjustmentModalOpen(false)}>Batal</Button>
                        <Button onClick={handleRequestAdjustment}>Kirim Pengajuan</Button>
                    </div>
                 </div>
            </Modal>
        </div>
    );
};

// Sub-components for each view
const MaterialsView = ({ materials, onAddClick, onPrintChecklist, onAdjustClick, threshold }: { materials: Material[], onAddClick: () => void, onPrintChecklist: () => void, onAdjustClick: () => void, threshold: number }) => (
    <div className="space-y-4">
        <div className="flex justify-end gap-2 flex-wrap">
            <Button variant="outline" onClick={onAdjustClick}><Edit size={18} /> Buat Penyesuaian Manual</Button>
            <Button variant="outline" onClick={onPrintChecklist}><Printer size={18} /> Cetak Form Stok Opname</Button>
            <Button onClick={onAddClick}><Plus size={18} /> Tambah Material</Button>
        </div>
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]"><thead className="bg-slate-50 border-b"><tr><th className="p-4 font-semibold">Nama Material</th><th className="p-4 font-semibold">Stok</th><th className="p-4 font-semibold">Satuan</th><th className="p-4 font-semibold">Harga/Satuan</th><th className="p-4 font-semibold">Nilai Stok</th></tr></thead><tbody>{materials.map(mat => (<tr key={mat.id} className="border-b last:border-0 hover:bg-slate-50"><td className="p-4">{mat.name}</td><td className="p-4"><StockStatusIndicator stock={mat.stock} threshold={threshold} /></td><td className="p-4">{mat.unit}</td><td className="p-4">{formatCurrency(mat.pricePerUnit)}</td><td className="p-4 font-semibold">{formatCurrency(mat.stock * mat.pricePerUnit)}</td></tr>))}</tbody></table>
            </div>
        </div>
    </div>
);

const FinishedGoodsView = ({ reports, finishedGoods, onReceive, onPrintChecklist, onAdjustClick, currentUser, onEditClick, threshold, onQuickAddClick }: { reports: ProductionReport[], finishedGoods: FinishedGood[], onReceive: (report: ProductionReport) => void, onPrintChecklist: () => void, onAdjustClick: () => void, currentUser: UserData, onEditClick: (good: FinishedGood) => void, threshold: number, onQuickAddClick: () => void }) => {
    const [stockFilter, setStockFilter] = useState<'all' | 'high' | 'low' | 'empty'>('all');

    const filteredGoods = useMemo(() => {
        const lowStockThreshold = threshold;
        switch (stockFilter) {
            case 'high':
                return finishedGoods.filter(g => g.stock > lowStockThreshold);
            case 'low':
                return finishedGoods.filter(g => g.stock > 0 && g.stock <= lowStockThreshold);
            case 'empty':
                return finishedGoods.filter(g => g.stock === 0);
            case 'all':
            default:
                return finishedGoods;
        }
    }, [finishedGoods, stockFilter, threshold]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-700 mb-2 flex items-center gap-2">
                    Barang Masuk dari Produksi
                    {reports.length > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{reports.length}</span>
                    )}
                </h2>
                <div className="bg-white p-4 rounded-xl shadow-md space-y-3">
                    {reports.length > 0 ? reports.map(r => (
                        <div key={r.id} className="bg-slate-50 p-3 rounded-lg flex justify-between items-center">
                            <p>Produksi #{r.id} - {r.hppResult.garmentsProduced} pcs {r.selectedGarment}</p>
                            <Button size="sm" onClick={() => onReceive(r)}>Terima Barang</Button>
                        </div>
                    )) : <p className="text-slate-500 text-center py-4">Tidak ada barang baru dari produksi.</p>}
                </div>
            </div>
            <div>
                <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                    <h2 className="text-xl font-bold text-slate-700">Stok Barang Jadi</h2>
                    <div className="flex gap-2 flex-wrap">
                        <Button variant="primary" size="sm" onClick={onQuickAddClick}><PlusCircle size={16}/> Tambah Produk Cepat</Button>
                        <Button variant="outline" size="sm" onClick={onAdjustClick}><Edit size={16}/> Buat Penyesuaian Manual</Button>
                        <Button variant="outline" size="sm" onClick={onPrintChecklist}><Printer size={16}/> Cetak Form Stok Opname</Button>
                    </div>
                </div>
                <div className="flex items-center gap-2 mb-4 p-2 bg-slate-50 rounded-lg flex-wrap">
                    <p className="text-sm font-semibold text-slate-600 mr-2">Filter Stok:</p>
                    <Button size="sm" variant={stockFilter === 'all' ? 'primary' : 'ghost'} onClick={() => setStockFilter('all')}>Semua</Button>
                    <Button size="sm" variant={stockFilter === 'high' ? 'primary' : 'ghost'} onClick={() => setStockFilter('high')}>Stok Banyak</Button>
                    <Button size="sm" variant={stockFilter === 'low' ? 'primary' : 'ghost'} onClick={() => setStockFilter('low')}>Stok Sedikit</Button>
                    <Button size="sm" variant={stockFilter === 'empty' ? 'primary' : 'ghost'} onClick={() => setStockFilter('empty')}>Stok Habis</Button>
                </div>
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[700px]">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="p-4 font-semibold w-16">Gambar</th>
                                <th className="p-4 font-semibold">Produk</th>
                                <th className="p-4 font-semibold">Stok</th>
                                {currentUser.department !== 'gudang' && <th className="p-4 font-semibold">HPP</th>}
                                <th className="p-4 font-semibold">Harga Jual</th>
                                <th className="p-4 font-semibold">Nilai Stok</th>
                                <th className="p-4 font-semibold"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredGoods.map(good => (
                                <tr key={good.id} className="border-b last:border-b-0 hover:bg-slate-50">
                                    <td className="p-2">
                                        <img src={good.imageUrls?.[0] || `https://placehold.co/40x40/e2e8f0/64748b?text=KZM`} alt={good.name} className="w-10 h-10 rounded-md object-cover bg-slate-100"/>
                                    </td>
                                    <td className="p-4">{good.name} - {good.size} ({good.colorName})</td>
                                    <td className="p-4"><StockStatusIndicator stock={good.stock} threshold={threshold} /> pcs</td>
                                    {currentUser.department !== 'gudang' && <td className="p-4">{formatCurrency(good.hpp)}</td>}
                                    <td className="p-4">{formatCurrency(good.sellingPrice)}</td>
                                    <td className="p-4 font-semibold">{formatCurrency(good.stock * good.hpp)}</td>
                                    <td className="p-4 text-right">
                                        <Button variant="outline" size="sm" onClick={() => onEditClick(good)}><Edit size={16}/></Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                    {filteredGoods.length === 0 && (
                        <p className="text-center text-slate-500 py-8">
                            Tidak ada produk yang cocok dengan filter yang dipilih.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

const RecommendationCard = ({ title, icon, products, onAdd, requestItems }: { title: string, icon: React.ReactNode, products: FinishedGood[], onAdd: (product: FinishedGood) => void, requestItems: {productId: string}[] }) => {
    if (products.length === 0) return null;
    
    const requestProductIds = new Set(requestItems.map(item => item.productId));

    return (
        // FIX: Replaced div with Card component for consistency and to fix type errors.
        <Card className="p-4">
            <h3 className="font-bold text-slate-800 flex items-center mb-2">{icon}{title} <span className="ml-2 bg-slate-200 text-slate-600 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">{products.length}</span></h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {products.map(product => {
                    const isInRequest = requestProductIds.has(product.id);
                    return (
                        <div key={product.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                            <div>
                                <p className="text-sm font-semibold">{product.name} {product.size} ({product.colorName})</p>
                                <p className="text-xs text-slate-500">Stok saat ini: {product.stock}</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => onAdd(product)} disabled={isInRequest} className="text-xs !py-1 !px-2">
                                {isInRequest ? <><Check size={14} className="mr-1"/> Ditambahkan</> : <><PlusCircle size={14} className="mr-1"/> Tambah</>}
                            </Button>
                        </div>
                    )
                })}
            </div>
        </Card>
    );
};


const ProductionRequestView = ({ finishedGoods, currentUser, addActivity, setProductionRequests, productionRequests, users, threshold }: { finishedGoods: FinishedGood[], currentUser: UserData, addActivity: (type: string, description: string, relatedId?: string) => void, setProductionRequests: React.Dispatch<React.SetStateAction<ProductionRequest[]>>, productionRequests: ProductionRequest[], users: UserData[], threshold: number }) => {
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [requestItems, setRequestItems] = useState<{ id: string; productId: string; quantity: number; }[]>([{ id: crypto.randomUUID(), productId: '', quantity: 10 }]);
    const [requestNotes, setRequestNotes] = useState('');
    const { addToast } = useToast();

    // --- Stock Recommendation Logic ---
    const outOfStockGoods = useMemo(() => finishedGoods.filter(g => g.stock === 0), [finishedGoods]);
    const lowStockGoods = useMemo(() => finishedGoods.filter(g => g.stock > 0 && g.stock <= threshold), [finishedGoods, threshold]);

    const addItemToRequestForm = (product: FinishedGood) => {
        if (requestItems.some(item => item.productId === product.id)) {
            addToast({ title: 'Info', message: `${product.name} ${product.size} sudah ada di form permintaan.`, type: 'info' });
            return;
        }

        setRequestItems(prev => {
            const isPlaceholder = prev.length === 1 && prev[0].productId === '';
            const newItem = { id: crypto.randomUUID(), productId: product.id, quantity: 10 };
            return isPlaceholder ? [{...newItem, id: prev[0].id}] : [...prev, newItem];
        });

        if (!isRequestModalOpen) {
            setIsRequestModalOpen(true);
        }
    };
    // --- End of Recommendation Logic ---

    const handleItemChange = (itemId: string, field: 'productId' | 'quantity', value: string | number) => {
        setRequestItems(items => items.map(item => item.id === itemId ? { ...item, [field]: value } : item));
    };

    const addRequestItem = () => {
        setRequestItems(items => [...items, { id: crypto.randomUUID(), productId: '', quantity: 10 }]);
    };

    const removeRequestItem = (itemId: string) => {
        setRequestItems(items => items.filter(item => item.id !== itemId));
    };

    const handleCreateRequest = () => {
        const validItems = requestItems.filter(item => item.productId && item.quantity > 0);
        if (validItems.length === 0) {
            addToast({ title: 'Error', message: 'Harap tambahkan setidaknya satu produk dengan jumlah yang valid.', type: 'error' });
            return;
        }

        const itemsForRequest: ProductionRequestItem[] = validItems.map(item => {
            const product = finishedGoods.find(g => g.id === item.productId);
            return {
                productId: item.productId,
                productName: product ? `${product.name} ${product.size} (${product.colorName})` : 'Produk Tidak Dikenal',
                requestedQuantity: item.quantity,
            };
        });

        const newRequest: ProductionRequest = {
            id: generateSequentialId('REQ'),
            timestamp: new Date().toISOString(),
            items: itemsForRequest,
            status: 'pending',
            requestedBy: currentUser.uid,
            notes: requestNotes,
            approvedByProductionAt: null,
            completedProductionAt: null,
            approvedByWarehouseAt: null,
            productionNotes: ''
        };

        setProductionRequests((prev: ProductionRequest[]) => [newRequest, ...prev]);
        addActivity('Gudang', `Membuat permintaan produksi baru #${newRequest.id}`, newRequest.id);
        addToast({ title: 'Berhasil', message: 'Permintaan produksi telah dikirim.', type: 'success' });
        
        setIsRequestModalOpen(false);
        setRequestItems([{ id: crypto.randomUUID(), productId: '', quantity: 10 }]);
        setRequestNotes('');
    };
    
    const getStatusBadge = (status: ProductionRequestStatus) => {
        const styles: { [key: string]: string } = {
            'pending': 'bg-yellow-100 text-yellow-800', 'approved_by_production': 'bg-blue-100 text-blue-800', 'completed_production': 'bg-green-100 text-green-800', 'rejected': 'bg-red-100 text-red-800', 'approved_by_warehouse': 'bg-teal-100 text-teal-800',
        };
        const text: { [key: string]: string } = {
            'pending': 'Pending', 'approved_by_production': 'Disetujui Produksi', 'completed_production': 'Selesai Produksi', 'rejected': 'Ditolak', 'approved_by_warehouse': 'Diterima Gudang',
        };
        return <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${styles[status]}`}>{text[status] || status}</span>
    };
    
    const hasRecommendations = outOfStockGoods.length > 0 || lowStockGoods.length > 0;

    return (
        <div className="space-y-6">
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold text-slate-700">Rekomendasi Restock</h2>
                    <Button onClick={() => setIsRequestModalOpen(true)}><Plus size={18}/> Buat Permintaan Manual</Button>
                </div>
                {hasRecommendations ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <RecommendationCard title="Stok Habis" icon={<AlertCircle size={20} className="mr-2 text-red-500"/>} products={outOfStockGoods} onAdd={addItemToRequestForm} requestItems={requestItems} />
                        <RecommendationCard title="Stok Menipis" icon={<AlertTriangle size={20} className="mr-2 text-orange-500"/>} products={lowStockGoods} onAdd={addItemToRequestForm} requestItems={requestItems} />
                    </div>
                ) : (
                    // FIX: Replaced div with Card component for consistency and to fix type errors.
                    <Card className="text-center p-8 text-slate-500">
                        <PackageCheck size={40} className="mx-auto text-green-500 mb-2" />
                        <p className="font-semibold">Semua stok dalam kondisi aman!</p>
                        <p className="text-sm">Tidak ada rekomendasi restock saat ini.</p>
                    </Card>
                )}
            </div>

            <Modal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} title="Form Permintaan Produksi">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <AnimatePresence>
                            {requestItems.map((item, index) => (
                                <motion.div key={item.id} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-12 gap-2 items-end p-2 bg-slate-50 rounded-lg">
                                    <div className="col-span-7"><CustomSelect label={index === 0 ? 'Pilih Produk' : ''} value={item.productId} onChange={e => handleItemChange(item.id, 'productId', e.target.value)}><option value="">-- Pilih --</option>{finishedGoods.map(g => (<option key={g.id} value={g.id}>{g.name} {g.size} ({g.colorName}) - Stok: {g.stock}</option>))}</CustomSelect></div>
                                    <div className="col-span-3"><CustomInput label={index === 0 ? 'Jumlah' : ''} type="number" min="1" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)} /></div>
                                    <div className="col-span-2 flex justify-end">{requestItems.length > 1 && <Button variant="ghost" size="sm" className="!p-2 text-slate-400 hover:text-red-500 hover:bg-red-50" onClick={() => removeRequestItem(item.id)}><Trash2 size={16} /></Button>}</div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                     <Button variant="outline" size="sm" onClick={addRequestItem} className="mt-2"><Plus size={16}/> Tambah Produk</Button>
                    
                    <div className="pt-2">
                        <label className="block text-sm font-medium text-slate-600 mb-1">Catatan (Opsional)</label>
                        <textarea value={requestNotes} onChange={e => setRequestNotes(e.target.value)} rows={3} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Contoh: Stok menipis, persiapan event, dll."/>
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="secondary" onClick={() => setIsRequestModalOpen(false)}>Batal</Button>
                        <Button onClick={handleCreateRequest}>Kirim Permintaan</Button>
                    </div>
                </div>
            </Modal>

            <div className="bg-white rounded-xl shadow-md p-0">
                <h2 className="text-xl font-bold text-slate-700 p-4">Riwayat Permintaan</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[700px]">
                        <thead className="bg-slate-50 border-y"><tr className="text-slate-600">
                            <th className="p-3 font-semibold">ID Permintaan</th>
                            <th className="p-3 font-semibold">Produk Diminta</th>
                            <th className="p-3 font-semibold">Status</th>
                            <th className="p-3 font-semibold">Tanggal</th>
                            <th className="p-3 font-semibold">Catatan</th>
                        </tr></thead>
                        <tbody>
                            {productionRequests.length > 0 ? productionRequests.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(req => (
                                <tr key={req.id} className="border-b last:border-b-0">
                                    <td className="p-3 font-mono text-xs text-slate-500">{req.id}</td>
                                    <td className="p-3 font-medium">
                                        <ul className="space-y-1">
                                            {req.items.map((item, idx) => <li key={idx}><strong>{item.requestedQuantity}x</strong> {item.productName}</li>)}
                                        </ul>
                                    </td>
                                    <td className="p-3">{getStatusBadge(req.status)}</td>
                                    <td className="p-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(req.timestamp)}<br/>oleh {getUsernameById(req.requestedBy, users)}</td>
                                    <td className="p-3 text-xs text-slate-500">{req.notes || '-'}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={5} className="text-center p-8 text-slate-500">Belum ada riwayat permintaan.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


const VerificationView = ({ adjustments, onReview, users }: { adjustments: StockAdjustment[], onReview: (id: string, decision: 'approve' | 'reject') => void, users: UserData[] }) => {
    const pendingAdjustments = adjustments.filter(a => a.status === 'pending');
    return (
        <Card>
            <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">
                Permintaan Verifikasi Stok
                {pendingAdjustments.length > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{pendingAdjustments.length}</span>
                )}
            </h2>
            <div className="space-y-4">
                {pendingAdjustments.length > 0 ? pendingAdjustments.map(adj => (
                    <div key={adj.id} className="bg-white p-4 rounded-xl shadow-md border">
                        <div className="flex justify-between items-start">
                            <div>
                                <ul className="space-y-2">
                                    {adj.items.map((item, index) => (
                                        <li key={index}>
                                            <p className="font-bold text-lg">{item.itemName}</p>
                                            <p className={`text-xl font-bold ${item.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>{item.quantityChange > 0 ? '+' : ''}{item.quantityChange}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold">{getUsernameById(adj.requestedBy, users)}</p>
                                <p className="text-xs text-slate-500">{formatDate(adj.timestamp)}</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 mt-2 pt-2 border-t"><strong>Alasan:</strong> {adj.notes}</p>
                        <div className="flex gap-2 justify-end mt-4">
                            <Button size="sm" variant="danger" onClick={() => onReview(adj.id, 'reject')}><ThumbsDown size={14}/> Tolak</Button>
                            <Button size="sm" variant="primary" className="bg-green-600 hover:bg-green-700" onClick={() => onReview(adj.id, 'approve')}><ThumbsUp size={14}/> Setujui</Button>
                        </div>
                    </div>
                )) : <div className="text-center p-12 text-slate-500"><Check size={48} className="mx-auto text-slate-400 mb-2" /><p>Tidak ada permintaan verifikasi stok.</p></div>}
            </div>
        </Card>
    );
};

const OnlineOrdersView = ({ orders, onApprovePayment, onUpdateStatus, onDispatchOrder, currentUser, users }: { orders: OnlineOrder[], onApprovePayment: (orderId: string) => void, onUpdateStatus: (orderId: string, status: OnlineOrderStatus, assigneeId?: string, estimatedCompletionDate?: string) => void, onDispatchOrder: (order: OnlineOrder, trackingNumber: string) => void, currentUser: UserData, users: UserData[] }) => {
    const [trackingInput, setTrackingInput] = useState<{ [orderId: string]: string }>({});
    const [viewingProofUrl, setViewingProofUrl] = useState<string | null>(null);
    const [isPoApprovalModalOpen, setIsPoApprovalModalOpen] = useState(false);
    const [selectedPoOrder, setSelectedPoOrder] = useState<OnlineOrder | null>(null);
    const [estimatedCompletionDate, setEstimatedCompletionDate] = useState('');
    
    const canVerifyPayment = ['super_admin', 'admin', 'kepala_gudang'].includes(currentUser.role);
    
    const { addToast } = useToast();
    
    const pendingPaymentOrders = useMemo(() => orders.filter(o => o.status === 'pending_payment'), [orders]);
    const pendingPoDpOrders = useMemo(() => orders.filter(o => o.status === 'pending_dp'), [orders]);
    const activeOrders = useMemo(() => orders.filter(o => ['pending_gudang', 'approved_gudang', 'siap_kirim'].includes(o.status)), [orders]);
    const inProductionPoOrders = useMemo(() => orders.filter(o => o.status === 'in_production'), [orders]);
    const pendingWorkOrders = useMemo(() => activeOrders.filter(o => o.status === 'pending_gudang'), [activeOrders]);

    const handleTrackingInputChange = (orderId: string, value: string) => {
        setTrackingInput(prev => ({ ...prev, [orderId]: value }));
    };

    const getStatusInfo = (status: OnlineOrderStatus) => {
        const info: {[key in OnlineOrderStatus]: {text: string, color: string, icon: React.ReactNode}} = {
            'pending_payment': { text: 'Menunggu Pembayaran', color: 'bg-orange-100 text-orange-800', icon: <Wallet size={14}/> },
            'pending_gudang': { text: 'Menunggu Dikerjakan', color: 'bg-yellow-100 text-yellow-800', icon: <Package size={14}/> },
            'approved_gudang': { text: 'Sedang Disiapkan', color: 'bg-blue-100 text-blue-800', icon: <Package size={14}/> },
            'siap_kirim': { text: 'Siap Dikirim', color: 'bg-indigo-100 text-indigo-800', icon: <Truck size={14}/> },
            'diterima_kurir': { text: 'Diserahkan ke Kurir', color: 'bg-purple-100 text-purple-800', icon: <Truck size={14}/> },
            'selesai': { text: 'Selesai', color: 'bg-green-100 text-green-800', icon: <CheckCircle2 size={14}/> },
            'dibatalkan': { text: 'Dibatalkan', color: 'bg-red-100 text-red-800', icon: <X size={14}/> },
            'pending_dp': { text: 'Menunggu DP', color: 'bg-orange-100 text-orange-800', icon: <Wallet size={14}/> },
            'in_production': { text: 'Dalam Produksi', color: 'bg-cyan-100 text-cyan-800', icon: <Edit size={14}/> },
            'pending_payment_remaining': { text: 'Menunggu Pelunasan', color: 'bg-orange-100 text-orange-800', icon: <Wallet size={14}/> },
            'ready_for_pickup': { text: 'Siap Diambil', color: 'bg-lime-100 text-lime-800', icon: <PackageCheck size={14}/> },
            'ready_to_ship': { text: 'Siap Kirim (PO)', color: 'bg-indigo-100 text-indigo-800', icon: <Truck size={14}/> },
        };
        return info[status] || info['pending_gudang'];
    };

    const formatAddress = (address: Address) => {
        if (!address || !address.streetAndBuilding) return 'Ambil di Toko';
        return `${address.streetAndBuilding}, ${address.city}, ${address.province}`;
    };

    const calculateRecommendedDate = () => {
        const inProductionOrders = orders.filter(o => o.status === 'in_production' && o.estimatedCompletionDate);
        if (inProductionOrders.length === 0) {
            const today = new Date();
            today.setDate(today.getDate() + 7); // Default to 7 days from now
            return today.toISOString().split('T')[0];
        }
        const latestDate = new Date(Math.max(...inProductionOrders.map(o => new Date(o.estimatedCompletionDate!).getTime())));
        latestDate.setDate(latestDate.getDate() + 7); // Add 7 days buffer
        return latestDate.toISOString().split('T')[0];
    };

    const handleOpenPoApprovalModal = (order: OnlineOrder) => {
        setSelectedPoOrder(order);
        setEstimatedCompletionDate(calculateRecommendedDate());
        setIsPoApprovalModalOpen(true);
    };

    const handleConfirmPoApproval = () => {
        if (!selectedPoOrder || !estimatedCompletionDate) {
            addToast({ title: 'Error', message: 'Tanggal estimasi selesai harus diisi.', type: 'error' });
            return;
        }
        onUpdateStatus(selectedPoOrder.id, 'in_production', undefined, estimatedCompletionDate);
        setIsPoApprovalModalOpen(false);
        setSelectedPoOrder(null);
    };

    return (
        <div className="space-y-6">
            {canVerifyPayment && (
                <Card>
                    <h2 className="text-xl font-bold text-slate-700 mb-2 flex items-center gap-2">
                        Verifikasi Pembayaran
                        {(pendingPaymentOrders.length + pendingPoDpOrders.length) > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{pendingPaymentOrders.length + pendingPoDpOrders.length}</span>
                        )}
                    </h2>
                    <div className="space-y-4">
                        {[...pendingPaymentOrders, ...pendingPoDpOrders].map(order => (
                            <div key={order.id} className="bg-white p-4 rounded-xl shadow-md border">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-bold text-lg">{order.customerName}</p>
                                        <p className="text-sm text-slate-500">Order #{order.id}</p>
                                    </div>
                                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                                        {order.orderType === 'po' ? 'Menunggu DP' : 'Menunggu Pembayaran'}
                                    </span>
                                </div>
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-grow">
                                        <div className="border-t pt-2 mt-2">
                                            {order.items.map(item => (
                                                <div key={item.id} className="flex justify-between items-center text-sm">
                                                    <span>{item.quantity}x {item.name}</span>
                                                    <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="border-t pt-2 mt-2 font-semibold flex justify-between">
                                            <span>Total</span>
                                            <span>{formatCurrency(order.orderType === 'po' ? order.downPayment : order.items.reduce((sum, item) => sum + item.price * item.quantity, 0) + order.shippingCost)}</span>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 w-full md:w-48">
                                        <p className="text-sm font-semibold mb-1">Bukti Pembayaran:</p>
                                        {order.downPaymentProofUrl ? (
                                            <button type="button" onClick={() => setViewingProofUrl(order.downPaymentProofUrl!)} className="w-full h-auto rounded-lg overflow-hidden group">
                                                <img src={order.downPaymentProofUrl} alt="Bukti Pembayaran" className="w-full h-full object-contain bg-slate-100 transition-transform duration-300 group-hover:scale-110"/>
                                            </button>
                                        ) : <div className="w-full h-32 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 text-sm">Bukti belum diunggah</div>}
                                    </div>
                                </div>
                                <div className="flex justify-end mt-4">
                                    <Button size="sm" variant="primary" onClick={() => order.orderType === 'po' ? handleOpenPoApprovalModal(order) : onApprovePayment(order.id)} disabled={!order.downPaymentProofUrl}>
                                        <CheckCircle2 size={16} className="mr-2" /> Konfirmasi Pembayaran
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {(pendingPaymentOrders.length + pendingPoDpOrders.length) === 0 && (
                             <div className="text-center p-12 text-slate-500">
                                <Wallet size={48} className="mx-auto text-slate-400 mb-2" />
                                <p>Tidak ada pesanan yang menunggu verifikasi.</p>
                            </div>
                        )}
                    </div>
                </Card>
            )}
            
            <Modal isOpen={!!viewingProofUrl} onClose={() => setViewingProofUrl(null)} title="Bukti Pembayaran">
                <img src={viewingProofUrl || ''} alt="Bukti Pembayaran" className="w-full h-auto rounded-lg max-h-[80vh] object-contain"/>
            </Modal>

            <Modal isOpen={isPoApprovalModalOpen} onClose={() => setIsPoApprovalModalOpen(false)} title={`Setujui PO #${selectedPoOrder?.id}`}>
                <div className="space-y-4">
                    <p>Konfirmasi penerimaan DP dan tetapkan tanggal estimasi selesai produksi untuk pesanan ini.</p>
                    <CustomInput 
                        label="Tanggal Estimasi Selesai" 
                        type="date" 
                        value={estimatedCompletionDate} 
                        onChange={e => setEstimatedCompletionDate(e.target.value)} 
                    />
                    <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded-md">
                        <strong>Rekomendasi sistem:</strong> {new Date(calculateRecommendedDate()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="secondary" onClick={() => setIsPoApprovalModalOpen(false)}>Batal</Button>
                        <Button onClick={handleConfirmPoApproval}>Setujui & Mulai Produksi</Button>
                    </div>
                </div>
            </Modal>

            <Card>
                <h2 className="text-xl font-bold text-slate-700 mb-2 flex items-center gap-2">
                    Pesanan Aktif
                    {pendingWorkOrders.length > 0 && (
                        <span className="bg-yellow-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{pendingWorkOrders.length}</span>
                    )}
                </h2>
                <div className="space-y-4">
                    {[...activeOrders, ...inProductionPoOrders].map(order => {
                        const canProcess = currentUser.department === 'gudang' || ['super_admin', 'admin', 'kepala_gudang'].includes(currentUser.role);

                        return (
                            <div key={order.id} className="bg-white p-4 rounded-xl shadow-md border">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-bold text-lg">{order.customerName}</p>
                                        <p className="text-sm text-slate-500">{formatAddress(order.shippingAddress)}</p>
                                    </div>
                                    <div className={`flex items-center gap-2 text-xs font-semibold px-2 py-1 rounded-full ${getStatusInfo(order.status).color}`}>
                                        {getStatusInfo(order.status).icon}
                                        <span>{getStatusInfo(order.status).text}</span>
                                    </div>
                                </div>
                                <div className="border-t pt-2 mt-2">
                                    {order.items.map(item => (
                                        <div key={item.id} className="flex justify-between items-center text-sm">
                                            <span>{item.quantity}x {item.name}</span>
                                            <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                                        </div>
                                    ))}
                                    {order.estimatedCompletionDate && (
                                        <p className="text-xs text-blue-600 font-semibold pt-1 text-right">Estimasi Selesai: {new Date(order.estimatedCompletionDate).toLocaleDateString('id-ID')}</p>
                                    )}
                                </div>
                                <p className="text-sm text-slate-600 mt-2 pt-2 border-t">
                                    <strong>{order.status === 'pending_gudang' && !order.assignedTo ? 'Ditugaskan kepada:' : 'Dikerjakan oleh:'}</strong> 
                                    {order.assignedTo ? getUsernameById(order.assignedTo, users) : <span className="text-red-500">Staf Gudang</span>}
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2 justify-end mt-4">
                                    {order.status === 'pending_gudang' && (
                                        <Button size="sm" variant="primary" onClick={() => onUpdateStatus(order.id, 'approved_gudang', currentUser.uid)} disabled={!canProcess}>
                                            <Check size={14}/> Kerjakan Pesanan
                                        </Button>
                                    )}
                                    {order.status === 'approved_gudang' && (
                                        <div className="w-full sm:w-auto flex items-center gap-2">
                                            <CustomInput 
                                                placeholder="Masukkan No. Resi"
                                                className="!py-1.5 text-sm"
                                                value={trackingInput[order.id] || ''}
                                                onChange={(e) => handleTrackingInputChange(order.id, e.target.value)}
                                            />
                                            <Button size="sm" variant="primary" onClick={() => onDispatchOrder(order, trackingInput[order.id] || '')}>
                                                <Send size={14}/> Kirim
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                     {(activeOrders.length + inProductionPoOrders.length) === 0 && (
                        <div className="text-center p-12 text-slate-500">
                            <Package size={48} className="mx-auto text-slate-400 mb-2" />
                            <p>Tidak ada pesanan online yang perlu diproses.</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

const StockHistoryView = ({ history }: { history: StockHistoryEntry[] }) => (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[700px]"><thead className="bg-slate-50 border-b"><tr><th className="p-4 font-semibold">Tanggal</th><th className="p-4 font-semibold">Item</th><th className="p-4 font-semibold">Tipe</th><th className="p-4 font-semibold text-center">Perubahan</th><th className="p-4 font-semibold text-center">Stok Akhir</th><th className="p-4 font-semibold">Catatan</th></tr></thead><tbody>{history.map(entry => (<tr key={entry.id} className="border-b last:border-b-0 hover:bg-slate-50"><td className="p-4 text-slate-500 whitespace-nowrap">{formatDate(entry.timestamp)}</td><td className="p-4 font-medium">{entry.productName}</td><td className="p-4">{entry.type}</td><td className={`p-4 font-bold text-center ${entry.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>{entry.quantity > 0 ? '+' : ''}{entry.quantity}</td><td className="p-4 text-center">{entry.finalStock}</td><td className="p-4 text-slate-600">{entry.source}</td></tr>))}</tbody></table>
        </div>
    </div>
);
