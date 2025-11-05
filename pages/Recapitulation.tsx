// pages/Recapitulation.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Shirt, Archive, Users, FileSpreadsheet, Warehouse } from 'lucide-react';
import { StatCard } from '../components/ui/StatCard';
import { ChartComponent } from '../components/Chart';
import { formatCurrency, formatDate, getUsernameById, formatDateForExport } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { generatePdfReport } from '../lib/pdfGenerator';
import { useToast } from '../hooks/useToast';
import { useAppContext } from '../context/AppContext';

export const RecapitulationPage = () => {
    const { state } = useAppContext();
    const { sales, productionReports, materials, finishedGoods, activityLog, users } = state;

    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const { addToast } = useToast();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleExportSales = () => {
        if (sales.length === 0) {
            addToast({ title: 'Tidak Ada Data', message: 'Tidak ada data penjualan untuk diekspor.', type: 'info' });
            return;
        }

        const reportTitle = "Laporan Rekapitulasi Penjualan";
        const headers = [['ID', 'Tanggal', 'Pelanggan', 'Kasir', 'Item', 'Qty', 'Total']];
        const data = sales.map(sale => [
            sale.id.substring(5, 13).toUpperCase(),
            formatDateForExport(sale.timestamp),
            sale.customerName,
            getUsernameById(sale.userId, users),
            sale.items.map(i => i.name).join(', '),
            sale.items.reduce((sum, i) => sum + i.quantity, 0),
            formatCurrency(sale.result.grandTotal)
        ]);
        
        generatePdfReport(reportTitle, headers, data, `laporan-penjualan-${new Date().toISOString().split('T')[0]}.pdf`);
        setIsExportMenuOpen(false);
    };
    
    const handleExportProduction = () => {
         if (productionReports.length === 0) {
            addToast({ title: 'Tidak Ada Data', message: 'Tidak ada data produksi untuk diekspor.', type: 'info' });
            return;
        }

        const reportTitle = "Laporan Rekapitulasi Produksi";
        const headers = [['ID', 'Tanggal', 'Produk', 'Jumlah', 'HPP/pcs', 'Total Biaya']];
        const data = productionReports.map(report => [
            report.id.substring(5, 13).toUpperCase(),
            formatDateForExport(report.timestamp),
            report.selectedGarment,
            `${report.hppResult.garmentsProduced} pcs`,
            formatCurrency(report.hppResult.hppPerGarment),
            formatCurrency(report.hppResult.totalProductionCost)
        ]);

        generatePdfReport(reportTitle, headers, data, `laporan-produksi-${new Date().toISOString().split('T')[0]}.pdf`);
        setIsExportMenuOpen(false);
    };

    // --- OPTIMIZED METRICS CALCULATION ---
    // All sales-related metrics are calculated in a single pass for maximum performance.
    const salesMetrics = useMemo(() => {
        let totalRevenue = 0;
        let totalItemsSold = 0;
        const salesByDay: { [key: string]: number } = {};

        for (const sale of sales) {
            // Calculate total revenue
            totalRevenue += sale.result.grandTotal;

            // Calculate total items sold
            for (const item of sale.items) {
                totalItemsSold += item.quantity;
            }
            
            // Aggregate sales by day for the chart
            const day = new Date(sale.timestamp).toISOString().split('T')[0];
            salesByDay[day] = (salesByDay[day] || 0) + sale.result.grandTotal;
        }
        
        const sortedDays = Object.keys(salesByDay).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        
        const salesChartData = {
            labels: sortedDays,
            datasets: [{
                label: 'Total Penjualan per Hari',
                data: sortedDays.map(day => salesByDay[day]),
                borderColor: '#16a34a',
                backgroundColor: 'rgba(22, 163, 74, 0.1)',
                fill: true,
                tension: 0.3
            }]
        };

        return { totalRevenue, totalItemsSold, salesChartData };
    }, [sales]);

    // Other metrics are kept separate as they depend on different data sources.
    const totalMaterialValue = useMemo(() => 
        materials.reduce((sum, mat) => sum + (mat.stock * mat.pricePerUnit), 0),
    [materials]);

    const totalFinishedGoodsValue = useMemo(() => 
        finishedGoods.reduce((sum, good) => sum + (good.stock * good.hpp), 0),
    [finishedGoods]);

    const totalWarehouseValue = useMemo(() => 
        totalMaterialValue + totalFinishedGoodsValue,
    [totalMaterialValue, totalFinishedGoodsValue]);

    const totalFinishedGoodsStock = useMemo(() => 
        finishedGoods.reduce((sum, good) => sum + good.stock, 0),
    [finishedGoods]);

    const recentActivities = useMemo(() => 
        activityLog.slice(0, 5),
    [activityLog]);

    const productionChartData = useMemo(() => {
        const productionByCategory = productionReports.reduce((acc, report) => {
            const category = report.selectedGarment;
            acc[category] = (acc[category] || 0) + report.hppResult.garmentsProduced;
            return acc;
        }, {} as { [key: string]: number });

        return {
            labels: Object.keys(productionByCategory),
            datasets: [{
                label: 'Jumlah Produksi',
                data: Object.values(productionByCategory),
                backgroundColor: ['#4f46e5', '#22c55e', '#f59e0b', '#a855f7'],
            }]
        };
    }, [productionReports]);
    
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800">Rekapitulasi</h1>
                <div className="relative" ref={exportMenuRef}>
                    <Button variant="outline" size="sm" onClick={() => setIsExportMenuOpen(prev => !prev)}>
                        <FileSpreadsheet size={16}/> Ekspor Laporan PDF
                    </Button>
                    <AnimatePresence>
                        {isExportMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10"
                            >
                                <div className="py-1">
                                    <button
                                        onClick={handleExportSales}
                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        Laporan Penjualan
                                    </button>
                                    <button
                                        onClick={handleExportProduction}
                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        Laporan Produksi
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            
            <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Baris 1: Metrik Bisnis Utama */}
                <StatCard title="Total Pendapatan" value={formatCurrency(salesMetrics.totalRevenue)} icon={<DollarSign size={24} className="text-white"/>} color="bg-green-500" />
                <StatCard title="Item Terjual" value={`${salesMetrics.totalItemsSold} pcs`} icon={<Shirt size={24} className="text-white"/>} color="bg-blue-500" />
                <StatCard title="Nilai Stok Gudang (Total)" value={formatCurrency(totalWarehouseValue)} icon={<Warehouse size={24} className="text-white"/>} color="bg-teal-500" />
                <StatCard title="Jumlah Pengguna" value={users.length} icon={<Users size={24} className="text-white"/>} color="bg-purple-500" />

                {/* Baris 2: Rincian Stok */}
                <StatCard title="Nilai Stok Produk Jadi" value={formatCurrency(totalFinishedGoodsValue)} icon={<DollarSign size={24} className="text-white"/>} color="bg-blue-500" />
                <StatCard title="Total Stok Produk Jadi" value={`${totalFinishedGoodsStock} pcs`} icon={<Shirt size={24} className="text-white"/>} color="bg-blue-500" />
                <StatCard title="Nilai Stok Material" value={formatCurrency(totalMaterialValue)} icon={<DollarSign size={24} className="text-white"/>} color="bg-orange-500" />
                <StatCard title="Jenis Material Mentah" value={materials.length} icon={<Archive size={24} className="text-white"/>} color="bg-orange-500" />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border"
                >
                     <h2 className="text-xl font-bold text-slate-700 mb-4">Tren Penjualan Harian</h2>
                     <div className="h-80">
                         <ChartComponent type="line" data={salesMetrics.salesChartData} />
                     </div>
                </motion.div>
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-white p-6 rounded-xl shadow-lg border"
                >
                     <h2 className="text-xl font-bold text-slate-700 mb-4">Produksi per Kategori</h2>
                     <div className="h-80 flex items-center justify-center">
                         <ChartComponent type="doughnut" data={productionChartData} />
                     </div>
                </motion.div>
            </div>
             <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-white p-6 rounded-xl shadow-lg border"
            >
                 <h2 className="text-xl font-bold text-slate-700 mb-4">Aktivitas Terbaru</h2>
                 <ul className="space-y-3">
                     {recentActivities.map(log => (
                         <li key={log.id} className="flex items-start text-sm border-b pb-2 last:border-0 last:pb-0">
                             <div className="bg-slate-100 p-2 rounded-full mr-3 mt-1"><Shirt size={16} className="text-slate-500"/></div>
                             <div>
                                 <p className="text-slate-800 font-medium">{log.description}</p>
                                 <p className="text-xs text-slate-500">{log.type} oleh {getUsernameById(log.userId, users)} - {formatDate(log.timestamp)}</p>
                             </div>
                         </li>
                     ))}
                 </ul>
            </motion.div>
        </div>
    );
};