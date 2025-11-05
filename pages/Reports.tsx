// pages/Reports.tsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { CustomInput } from '../components/ui/CustomInput';
import { Card } from '../components/ui/Card';
import { formatDate, formatCurrency, getUsernameById } from '../lib/utils';
import { printProductionInvoice, printSaleReceipt, printStockHistory } from '../lib/print';
import type { Sale, ProductionReport, UserData, StockHistoryEntry, ProductionRequest, InventoryItem } from '../types';
import { Modal } from '../components/ui/Modal';
import { Shirt, ShoppingCart, Archive, Calendar, Printer } from 'lucide-react';
import { usePrintPreview } from '../components/PrintProvider';
import { useAppContext } from '../context/AppContext';

type ReportView = 'production' | 'sales' | 'warehouse';

export const ReportsPage = () => {
    const { state } = useAppContext();
    const { sales, productionReports, users, stockHistory, productionRequests, inventory } = state;

    const [view, setView] = useState<ReportView>('production');
    const [selectedItem, setSelectedItem] = useState<ProductionReport | Sale | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const { showPrintPreview } = usePrintPreview();

    const filteredProductionReports = useMemo(() => 
        productionReports.filter(r => {
            const date = new Date(r.timestamp);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            if (end) end.setHours(23, 59, 59, 999);
            return (!start || date >= start) && (!end || date <= end);
        }).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        [productionReports, startDate, endDate]
    );
    
    const filteredSales = useMemo(() => 
        sales.filter(s => {
            const date = new Date(s.timestamp);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            if (end) end.setHours(23, 59, 59, 999);
            return (!start || date >= start) && (!end || date <= end);
        }).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        [sales, startDate, endDate]
    );

    const handlePrint = (item: ProductionReport | Sale) => {
        if ('hppResult' in item) {
            printProductionInvoice(item, showPrintPreview);
        } else {
            printSaleReceipt(item, users.find(u => u.uid === item.userId), showPrintPreview);
        }
    };
    
    const renderContent = () => {
        switch(view) {
            case 'production': return <ReportList reports={filteredProductionReports} onSelect={setSelectedItem} type="production" />;
            case 'sales': return <ReportList reports={filteredSales} onSelect={setSelectedItem} type="sales" />;
            case 'warehouse': return <WarehouseReportView />;
            default: return null;
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Laporan</h1>

            <Card>
                <div className="flex flex-col sm:flex-row gap-4 items-center border-b pb-4 mb-4">
                    <Calendar className="text-slate-500 hidden sm:block" />
                    <CustomInput label="Dari Tanggal" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    <span className="text-slate-500 mt-6 hidden sm:block">-</span>
                    <CustomInput label="Sampai Tanggal" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    <Button variant="outline" className="w-full sm:w-auto mt-6" onClick={() => {setStartDate(''); setEndDate('')}}>Reset</Button>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button variant={view === 'production' ? 'primary' : 'ghost'} onClick={() => setView('production')}><Shirt size={16}/> Laporan Produksi</Button>
                    <Button variant={view === 'sales' ? 'primary' : 'ghost'} onClick={() => setView('sales')}><ShoppingCart size={16}/> Laporan Penjualan</Button>
                    <Button variant={view === 'warehouse' ? 'primary' : 'ghost'} onClick={() => setView('warehouse')}><Archive size={16}/> Laporan Gudang</Button>
                </div>
            </Card>

            <AnimatePresence mode="wait">
                <motion.div key={view} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                    {renderContent()}
                </motion.div>
            </AnimatePresence>
            
            <AnimatePresence>
                {selectedItem && (
                    <ReportDetailModal 
                        item={selectedItem} 
                        onClose={() => setSelectedItem(null)} 
                        onPrint={handlePrint}
                        users={users}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// Sub-components for different report views
const ReportList = ({ reports, onSelect, type }: { reports: (ProductionReport | Sale)[], onSelect: (item: any) => void, type: 'production' | 'sales' }) => {
    if (reports.length === 0) return <Card><p className="text-center text-slate-500 py-8">Tidak ada laporan yang ditemukan.</p></Card>
    return (
        <Card className="p-0">
            <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[600px]">
                <thead className="bg-slate-50 border-b"><tr className="text-slate-600">
                    <th className="p-4 font-semibold">ID Laporan</th>
                    <th className="p-4 font-semibold">Tanggal</th>
                    <th className="p-4 font-semibold">Detail</th>
                    <th className="p-4 font-semibold text-right">Nilai</th>
                    <th className="p-4 font-semibold"></th>
                </tr></thead>
                <tbody>{reports.map(item => (
                    <tr key={item.id} className="border-b last:border-b-0 hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono text-slate-500">{item.id}</td>
                        <td className="p-4 text-slate-600 whitespace-nowrap">{formatDate(item.timestamp)}</td>
                        <td className="p-4">{type === 'production' ? `${(item as ProductionReport).hppResult.garmentsProduced} pcs ${(item as ProductionReport).selectedGarment}` : `${(item as Sale).customerName}`}</td>
                        <td className="p-4 font-semibold text-right">{type === 'production' ? formatCurrency((item as ProductionReport).hppResult.totalProductionCost) : formatCurrency((item as Sale).result.grandTotal)}</td>
                        <td className="p-4 text-right"><Button size="sm" variant="outline" onClick={() => onSelect(item)}>Lihat Detail</Button></td>
                    </tr>
                ))}</tbody>
            </table>
            </div>
        </Card>
    );
};

const WarehouseReportView = () => {
    const { state } = useAppContext();
    const { stockHistory, productionRequests, inventory, users } = state;
    const { showPrintPreview } = usePrintPreview();
    
    return (
        <div className="space-y-6">
            <Card>
                <div className="flex justify-between items-center">
                     <h2 className="text-xl font-bold text-slate-700">Laporan Riwayat Stok</h2>
                     <Button variant="outline" size="sm" onClick={() => printStockHistory(stockHistory, showPrintPreview)}><Printer size={16}/> Cetak</Button>
                </div>
                <div className="max-h-96 overflow-y-auto mt-4">
                    <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[600px]">
                        <thead className="bg-slate-50 border-b sticky top-0"><tr className="text-slate-600">
                            <th className="p-2 font-semibold">Waktu</th>
                            <th className="p-2 font-semibold">Produk</th>
                            <th className="p-2 font-semibold">Tipe</th>
                            <th className="p-2 font-semibold text-center">Jumlah</th>
                            <th className="p-2 font-semibold">Catatan</th>
                        </tr></thead>
                        <tbody>{stockHistory.map(h => (
                            <tr key={h.id} className="border-b last:border-b-0"><td className="p-2 text-xs text-slate-500 whitespace-nowrap">{formatDate(h.timestamp)}</td><td className="p-2 font-medium">{h.productName}</td><td className="p-2 text-xs">{h.type}</td><td className={`p-2 font-bold text-center ${h.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>{h.quantity > 0 ? '+' : ''}{h.quantity}</td><td className="p-2 text-xs text-slate-500">{h.source}</td></tr>
                        ))}</tbody>
                    </table>
                    </div>
                </div>
            </Card>
            <Card>
                <h2 className="text-xl font-bold text-slate-700">Laporan Permintaan Produksi</h2>
                {/* Can add more details here */}
            </Card>
        </div>
    );
};

// Modal for details
const ReportDetailModal = ({ item, onClose, onPrint, users }: { item: ProductionReport | Sale, onClose: () => void, onPrint: (item: any) => void, users: UserData[] }) => {
    const isProd = 'hppResult' in item;
    return (
        <Modal isOpen={true} onClose={onClose} title={isProd ? 'Detail Laporan Produksi' : 'Detail Penjualan'}>
            {isProd ? (
                <div className="space-y-3 text-sm">
                    <p><strong>ID:</strong> {item.id}</p>
                    <p><strong>Dibuat:</strong> {formatDate(item.timestamp)} oleh {getUsernameById(item.userId, users)}</p>
                    <p><strong>Produk:</strong> {(item as ProductionReport).selectedGarment}</p>
                    <p><strong>Total Produksi:</strong> {(item as ProductionReport).hppResult.garmentsProduced} pcs</p>
                    <p><strong>HPP/pcs:</strong> {formatCurrency((item as ProductionReport).hppResult.hppPerGarment)}</p>
                    <p><strong>Total Nilai Produksi:</strong> {formatCurrency((item as ProductionReport).hppResult.totalProductionCost)}</p>
                </div>
            ) : (
                <div className="space-y-3 text-sm">
                     <p><strong>ID Struk:</strong> {item.id}</p>
                     <p><strong>Waktu:</strong> {formatDate(item.timestamp)}</p>
                     <p><strong>Kasir:</strong> {getUsernameById(item.userId, users)}</p>
                     <p><strong>Pelanggan:</strong> {(item as Sale).customerName}</p>
                     <h4 className="font-semibold pt-2 border-t mt-2">Item:</h4>
                     <ul className="list-disc pl-5">{(item as Sale).items.map(i => <li key={i.id}>{i.quantity}x {i.name}</li>)}</ul>
                     <p className="font-bold pt-2 border-t mt-2">Total: {formatCurrency((item as Sale).result.grandTotal)}</p>
                </div>
            )}
            <div className="flex gap-2 justify-end mt-6">
                <Button variant="secondary" onClick={onClose}>Tutup</Button>
                <Button onClick={() => onPrint(item)}><Printer size={16}/> Cetak</Button>
            </div>
        </Modal>
    );
};
