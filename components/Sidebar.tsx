
// components/Sidebar.tsx
import React, { useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { 
    LayoutDashboard, Shirt, Warehouse, ShoppingCart, BarChart2, MessageSquare, 
    UserCog, Activity, Ruler, Tag, Award, DollarSign, ClipboardList,
    CalendarCheck, TrendingUp, Clock, BookOpen, CalendarCheck2, X, LogOut, ShieldCheck,
    Building2, SlidersHorizontal
} from 'lucide-react';
import { Button } from './ui/Button';

type Page = 'recapitulation' | 'production' | 'warehouse' | 'salesCalculator' | 'report' | 'messageBoard' | 'myProfile' | 'accountManagement' | 'activityLogs' | 'sizingStandards' | 'promo' | 'loyalCustomers' | 'payroll' | 'surveys' | 'attendance' | 'performanceDashboard' | 'mySalary' | 'sop' | 'prayerReport' | 'employeePerformanceDetail' | 'warrantyClaims' | 'companySettings' | 'stockSettings' | 'productionSettings';

interface NavItemConfig {
    icon: React.ElementType;
    label: string;
    pageName: Page;
    roles: string[];
    departments?: string[];
}

const navItems: NavItemConfig[] = [
    { icon: LayoutDashboard, label: 'Rekapitulasi', pageName: 'recapitulation', roles: ['super_admin'] },
    { icon: CalendarCheck, label: 'Absensi', pageName: 'attendance', roles: ['super_admin', 'admin'] },
    { icon: Shirt, label: 'Produksi', pageName: 'production', roles: ['super_admin', 'admin', 'member', 'kepala_produksi', 'kepala_gudang'], departments: ['produksi'] },
    { icon: Warehouse, label: 'Gudang', pageName: 'warehouse', roles: ['super_admin', 'admin', 'member', 'kepala_gudang'], departments: ['gudang'] },
    { icon: ShoppingCart, label: 'Penjualan', pageName: 'salesCalculator', roles: ['super_admin', 'admin', 'member', 'kepala_gudang', 'kepala_penjualan', 'penjualan'], departments: ['penjualan'] },
    { icon: BarChart2, label: 'Laporan', pageName: 'report', roles: ['super_admin', 'admin', 'kepala_gudang', 'kepala_produksi', 'kepala_penjualan'] },
    { icon: ShieldCheck, label: 'Klaim Garansi', pageName: 'warrantyClaims', roles: ['super_admin', 'admin', 'kepala_gudang', 'kepala_penjualan'] },
    { icon: DollarSign, label: 'Penggajian', pageName: 'payroll', roles: ['super_admin'] },
    { icon: Ruler, label: 'Fitting Ukuran', pageName: 'sizingStandards', roles: ['super_admin', 'kepala_produksi'] },
    { icon: Tag, label: 'Promo & Diskon', pageName: 'promo', roles: ['super_admin', 'admin', 'kepala_penjualan'] },
    { icon: Award, label: 'Pelanggan Setia', pageName: 'loyalCustomers', roles: ['super_admin', 'admin', 'kepala_penjualan'] },
    { icon: ClipboardList, label: 'Survei Kepuasan', pageName: 'surveys', roles: ['super_admin'] },
    { icon: DollarSign, label: 'Gaji Saya', pageName: 'mySalary', roles: ['admin', 'member', 'kepala_gudang', 'kepala_produksi', 'kepala_penjualan', 'penjualan'] },
    { icon: TrendingUp, label: 'Dasbor Kinerja', pageName: 'performanceDashboard', roles: ['admin', 'member', 'kepala_gudang', 'kepala_produksi', 'kepala_penjualan', 'penjualan'] },
    { icon: CalendarCheck2, label: 'Laporan Sholat', pageName: 'prayerReport', roles: ['admin', 'member', 'kepala_gudang', 'kepala_produksi', 'kepala_penjualan', 'penjualan'] },
    { icon: BookOpen, label: 'Pedoman SOP', pageName: 'sop', roles: ['super_admin', 'admin', 'member', 'kepala_gudang', 'kepala_produksi', 'kepala_penjualan', 'penjualan'] },
    { icon: MessageSquare, label: 'Papan Pesan', pageName: 'messageBoard', roles: ['super_admin', 'admin', 'member', 'kepala_gudang', 'kepala_produksi', 'kepala_penjualan', 'penjualan'] },
    { icon: UserCog, label: 'Profil Saya', pageName: 'myProfile', roles: ['super_admin', 'admin', 'member', 'kepala_gudang', 'kepala_produksi', 'kepala_penjualan', 'penjualan'] },
    { icon: UserCog, label: 'Manajemen Akun', pageName: 'accountManagement', roles: ['super_admin', 'admin'] },
    { icon: SlidersHorizontal, label: 'Pengaturan Stok', pageName: 'stockSettings', roles: ['super_admin', 'admin', 'kepala_gudang'] },
    { icon: SlidersHorizontal, label: 'Pengaturan Produksi', pageName: 'productionSettings', roles: ['super_admin'] },
    { icon: Building2, label: 'Info Perusahaan', pageName: 'companySettings', roles: ['super_admin'] },
    { icon: Activity, label: 'Aktivitas Kerja', pageName: 'activityLogs', roles: ['super_admin'] },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
    onClockOut: () => void;
    hasClockedIn: boolean;
    hasClockedOut: boolean;
}

export const Sidebar = ({ isOpen, onClose, onLogout, onClockOut, hasClockedIn, hasClockedOut }: SidebarProps) => {
    const { state, dispatch } = useAppContext();
    const { currentUser, page, productionRequests, productionReports, onlineOrders, warrantyClaims } = state;

    const notificationCounts = useMemo(() => {
        const production = productionRequests.filter(r => r.status === 'pending').length;
        
        const warehouse = 
            productionReports.filter(r => !r.isReceivedInWarehouse).length +
            onlineOrders.filter(o => o.status === 'pending_gudang' || o.status === 'pending_payment' || o.status === 'pending_dp').length;

        const warranty = warrantyClaims.filter(c => c.status === 'pending').length;

        return {
            production,
            warehouse,
            warrantyClaims: warranty,
        };
    }, [productionRequests, productionReports, onlineOrders, warrantyClaims]);

    const accessibleNavItems = navItems.filter(item => 
        currentUser && currentUser.role && item.roles.includes(currentUser.role) && 
        (currentUser.role === 'super_admin' || currentUser.role === 'admin' || currentUser.role === 'kepala_gudang' || !item.departments || (currentUser.department && item.departments.includes(currentUser.department)))
    );

    const sidebarVariants: Variants = {
        open: { x: 0, transition: { type: 'spring', stiffness: 400, damping: 40 } },
        closed: { x: '-100%', transition: { type: 'spring', stiffness: 400, damping: 40 } }
    };

    const NavItem: React.FC<{ icon: React.ElementType; label: string; pageName: Page; count?: number }> = ({ icon: Icon, label, pageName, count }) => (
        <button
            onClick={() => { dispatch({ type: 'SET_PAGE', payload: pageName }); if(window.innerWidth < 768) onClose(); }}
            className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group relative ${ page === pageName ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:bg-indigo-100 hover:text-indigo-600' }`}
        >
            <Icon size={20} className={`mr-3 flex-shrink-0 transition-colors duration-200 ${page === pageName ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'}`} />
            <span className="truncate flex-grow text-left">{label}</span>
            {count && count > 0 ? (
                <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="ml-2 flex-shrink-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                >
                    {count > 9 ? '9+' : count}
                </motion.span>
            ) : null}
        </button>
    );

    if (!currentUser) return null;

    return (
        <motion.aside 
            className="w-64 bg-white/95 backdrop-blur-sm border-r border-slate-200/80 flex flex-col p-4 absolute md:relative h-full z-40"
            variants={sidebarVariants}
            initial={false}
            animate={isOpen ? "open" : "closed"}
        >
            <div className="flex justify-between items-center mb-8 px-2">
                <h1 className="text-2xl font-bold text-indigo-600">KAZUMI</h1>
                <button className="md:hidden text-slate-500" onClick={onClose}><X/></button>
            </div>
            <nav className="flex-grow space-y-1.5 overflow-y-auto pr-1">
                {accessibleNavItems.map(item => {
                     let count: number | undefined = undefined;
                     switch (item.pageName) {
                         case 'production':
                             count = notificationCounts.production;
                             break;
                         case 'warehouse':
                             count = notificationCounts.warehouse;
                             break;
                         case 'warrantyClaims':
                            count = notificationCounts.warrantyClaims;
                            break;
                     }
                    return <NavItem key={item.pageName} icon={item.icon} label={item.label} pageName={item.pageName as Page} count={count} />
                })}
            </nav>
            <div className="mt-auto pt-4 border-t border-slate-200/80">
                <div className="flex items-center p-2 mb-2">
                    <img src={currentUser.profilePictureUrl} alt={currentUser.fullName} className="w-10 h-10 rounded-full mr-3 object-cover" />
                    <div className="flex-1 overflow-hidden">
                        <p className="font-semibold text-slate-800 truncate">{currentUser.fullName}</p>
                        <p className="text-sm text-slate-500 capitalize truncate">{currentUser.role === 'member' ? currentUser.department : currentUser.role.replace('_', ' ')}</p>
                    </div>
                </div>
                {hasClockedIn && !hasClockedOut && (
                    <Button variant="outline" size="sm" className="w-full mb-2" onClick={onClockOut}>
                        <Clock size={16} className="mr-2"/> Clock Out
                    </Button>
                )}
                <button
                    onClick={onLogout}
                    className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors group"
                >
                    <LogOut size={20} className="mr-3 text-slate-400 group-hover:text-red-500 transition-colors" />
                    Logout
                </button>
            </div>
        </motion.aside>
    );
};
