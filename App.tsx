// App.tsx
// FIX: Import `useEffect` from React.
import React, { useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Menu, UserX, Clock } from 'lucide-react';
import { AppProvider, useAppContext } from './context/AppContext';

import { AuthPage } from './pages/AuthPage';
import { CatalogPage } from './pages/CatalogPage';
import { AttendanceModal } from './components/AttendanceModal';
import { SurveyFormModal } from './components/SurveyFormModal';
import { PrayerSubmissionModal } from './components/PrayerSubmissionModal';
import { WorkClock } from './components/WorkClock';
import { PrayerTimeReminder } from './components/PrayerTimeReminder';
import { ClockOutPage } from './pages/ClockOutPage';
import { AutoLogoutPage } from './pages/AutoLogoutPage';
import { TerminationConfirmationPage } from './pages/TerminationConfirmationPage';
import { Sidebar } from './components/Sidebar';
import { PageContent } from './components/PageContent';
import { AdminChatManager } from './components/AdminChatManager';
import { ForcePasswordChangePage } from './pages/ForcePasswordChangePage';

import { ToastProvider, useToast } from './hooks/useToast';
import { PrintProvider } from './components/PrintProvider';

// FIX: Import necessary types for props
import type { SurveyAnswer, AttendanceStatus, PrayerName, SaleItem, UserData } from './types';
import { Button } from './components/ui/Button';

// ===================================================================================

const AppContent = () => {
    // FIX: Renamed 'state' to 'appState' to avoid a potential variable name collision within the scope, resolving the "redeclare" error.
    const { state: appState, dispatch } = useAppContext();
    // FIX: Destructure garmentPatterns from appState to pass to CatalogPage.
    const { currentUser, page, cart, poCart, onlineOrders, bankAccounts, promoCodes, finishedGoods, surveyQuestions, attendanceRecords, payrollHistory, messages, users, sizingStandards, warrantyClaims, garmentPatterns } = appState;
    const { addToast } = useToast();

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
    const [isAttendancePending, setIsAttendancePending] = useState(false);
    const [isPrayerModalOpen, setIsPrayerModalOpen] = useState(false);
    const [clockOutContext, setClockOutContext] = useState<'on_time' | 'overtime' | null>(null);

    // Initial page logic is now handled in the reducer during the LOGIN action to prevent re-render loops.
    // The useEffect that previously handled this has been removed.

    const todaysAttendance = useMemo(() => {
        if (!currentUser) return null;
        const today = new Date().toISOString().split('T')[0];
        return attendanceRecords.find(r => r.userId === currentUser.uid && r.date === today && r.status === 'Hadir');
    }, [attendanceRecords, currentUser]);

    const hasClockedIn = !!todaysAttendance;
    const hasClockedOut = !!todaysAttendance?.clockOutTimestamp;

    // Check for pending attendance
    useEffect(() => {
        if (currentUser && ['member', 'admin', 'kepala_gudang', 'kepala_produksi', 'kepala_penjualan', 'penjualan'].includes(currentUser.role)) {
            const today = new Date().toISOString().split('T')[0];
            const hasAttendedToday = attendanceRecords.some(
                record => record.userId === currentUser.uid && record.date === today
            );
            setIsAttendancePending(!hasAttendedToday);
        } else {
            setIsAttendancePending(false);
        }
    }, [currentUser, attendanceRecords]);

    // Check if survey needs to be shown, only on April 1st, August 1st, and December 1st.
    useEffect(() => {
        if (currentUser && ['admin', 'member', 'kepala_gudang', 'kepala_produksi', 'kepala_penjualan'].includes(currentUser.role)) {
            const today = new Date();
            const currentMonth = today.getMonth(); // 0-11 (April is 3, August is 7, December is 11)
            const currentDay = today.getDate();   // 1-31

            // The survey should only appear on the 1st of April, August, and December.
            const isSurveyDay =
                (currentMonth === 3 && currentDay === 1) || // April 1st
                (currentMonth === 7 && currentDay === 1) || // August 1st
                (currentMonth === 11 && currentDay === 1);  // December 1st
            
            // If it's not the specific survey day, do nothing.
            if (!isSurveyDay) {
                return;
            }

            // Check if the user has already submitted the survey today.
            const lastSurvey = currentUser.lastSurveyDate ? new Date(currentUser.lastSurveyDate) : null;
            const hasSubmittedToday = lastSurvey &&
                lastSurvey.getFullYear() === today.getFullYear() &&
                lastSurvey.getMonth() === today.getMonth() &&
                lastSurvey.getDate() === today.getDate();
            
            // Show the survey only on the specific day and if they haven't submitted it yet today.
            if (isSurveyDay && !hasSubmittedToday) {
                 setTimeout(() => setIsSurveyModalOpen(true), 1500);
            }
        }
    }, [currentUser]);

    const handleAttendanceSubmit = (status: AttendanceStatus, proof: string) => {
        dispatch({ type: 'ADD_ATTENDANCE', payload: { status, proof } });
        setIsAttendancePending(false);
        addToast({ title: 'Kehadiran Dicatat', message: 'Terima kasih, selamat bekerja!', type: 'success' });
    };

    const handleClockOut = () => {
        if (!currentUser || !todaysAttendance) return;
        if (window.confirm('Anda yakin ingin clock out untuk hari ini?')) {
            const clockOutTimestamp = new Date();
            const endWork = new Date(todaysAttendance.date);
            endWork.setHours(16, 0, 0, 0); // 4:00 PM
            const overtimeMinutes = (clockOutTimestamp.getTime() - endWork.getTime()) / (1000 * 60);
            
            dispatch({ type: 'CLOCK_OUT', payload: { attendanceId: todaysAttendance.id, clockOutTime: clockOutTimestamp.toISOString() } });
            setClockOutContext(overtimeMinutes > 30 ? 'overtime' : 'on_time');
        }
    };
    
    const handlePrayerSubmit = (prayerName: PrayerName, photoProof: string) => {
        dispatch({ type: 'ADD_PRAYER_RECORD', payload: { prayerName, photoProof } });
        addToast({ title: 'Laporan Diterima', message: `Terima kasih, laporan sholat ${prayerName} Anda telah dicatat.`, type: 'success' });
        setIsPrayerModalOpen(false);
    };

    const handleSurveySubmit = (answers: SurveyAnswer[]) => {
        dispatch({ type: 'SUBMIT_SURVEY', payload: { answers } });
        addToast({ title: 'Terima Kasih!', message: 'Umpan balik Anda telah kami terima.', type: 'success' });
        setIsSurveyModalOpen(false);
    };

    const handleLogout = () => {
        dispatch({ type: 'LOGOUT' });
        setClockOutContext(null);
    };
    
    const handleConfirmAndProceedToLogout = useCallback(() => {
        dispatch({ type: 'SET_PAGE', payload: 'autoLogout' });
    }, [dispatch]);

    // FIX: Handlers for CatalogPage props
    const handlePlaceOrder = (orderInfo: any, cart: SaleItem[]) => {
        // FIX: Removed `orderType` from the action payload. This property is not defined in the action's type definition and is already correctly hardcoded within the reducer logic, resolving the TypeScript error.
        dispatch({ type: 'PLACE_ONLINE_ORDER', payload: { orderInfo, cart } });
        addToast({ title: 'Pesanan Dibuat', message: 'Pesanan Anda sedang diproses. Silakan cek halaman riwayat pesanan.', type: 'success' });
    };
    
    const handleUpdateProfile = (updates: Partial<UserData>) => {
        // FIX: Dispatched a function to correctly merge partial user data with the existing state,
        // satisfying the SetStateAction type required by the reducer.
        dispatch({
            type: 'UPDATE_CURRENT_USER',
            payload: (prevUser) => prevUser ? { ...prevUser, ...updates } : null
        });
    };
    
    // Centralized view logic for smoother transitions
    const getCurrentView = (): string => {
        if (!currentUser) return 'login';
        if (currentUser.forcePasswordChange) return 'force_password_change';
        if (clockOutContext) return 'clock_out';
        if (page === 'autoLogout') return 'auto_logout';
        if (!currentUser.isApproved && currentUser.role !== 'pending') return 'deactivated';
        if (currentUser.status === 'pending_termination') return 'termination_pending';
        // The attendance check is removed from here to fix the freezing bug.
        // It's now handled as a modal within the dashboard view.
        if (currentUser.role === 'customer') return 'customer_catalog';
        return 'dashboard';
    };

    const currentView = getCurrentView();
    
    const onOpenPrayerModal = useCallback(() => setIsPrayerModalOpen(true), []);
    
    const renderDashboard = () => (
      <div id="main-app-container" className="flex h-screen bg-slate-50 overflow-hidden">
          <AnimatePresence>
          {isSidebarOpen && (
               <motion.div
                  className="fixed inset-0 bg-black/30 z-30 md:hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSidebarOpen(false)}
              />
          )}
          </AnimatePresence>
          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
            onLogout={handleLogout} 
            onClockOut={handleClockOut}
            hasClockedIn={hasClockedIn}
            hasClockedOut={hasClockedOut}
          />
          <main className="flex-1 flex flex-col overflow-hidden">
              <header className="bg-white/80 backdrop-blur-sm p-4 border-b flex items-center md:hidden">
                  <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600">
                      <Menu />
                  </button>
                  <h2 className="ml-4 font-semibold text-slate-800">{appState.page}</h2>
              </header>
              <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                   <AnimatePresence mode="wait">
                      <motion.div
                          key={appState.page}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                      >
                          {/* FIX: Pass onOpenPrayerModal to PageContent */}
                          <PageContent onOpenPrayerModal={onOpenPrayerModal} />
                      </motion.div>
                  </AnimatePresence>
              </div>
          </main>
           {isAttendancePending && currentUser && (
              <AttendanceModal onSubmit={handleAttendanceSubmit} fullName={currentUser.fullName} />
           )}
           {isSurveyModalOpen && currentUser && (
              <SurveyFormModal
                  onClose={() => setIsSurveyModalOpen(false)}
                  onSubmit={handleSurveySubmit}
                  surveyQuestions={surveyQuestions}
              />
          )}
          {isPrayerModalOpen && currentUser && (
              <PrayerSubmissionModal
                  onClose={() => setIsPrayerModalOpen(false)}
                  onSubmit={handlePrayerSubmit}
              />
          )}
          
          <div className="fixed bottom-4 right-4 flex flex-col-reverse items-end gap-2 z-50">
                {currentUser && ['kepala_gudang', 'admin', 'super_admin'].includes(currentUser.role) && <AdminChatManager />}
                {hasClockedIn && !hasClockedOut && (
                    <>
                        <WorkClock todaysAttendance={todaysAttendance} />
                        <PrayerTimeReminder />
                    </>
                )}
          </div>
      </div>
    );

    const renderCurrentView = () => {
        switch (currentView) {
            case 'login':
                return <AuthPage />;
            case 'force_password_change':
                return <ForcePasswordChangePage />;
            case 'clock_out':
                return <ClockOutPage type={clockOutContext!} onFinish={handleLogout} />;
            case 'auto_logout':
                return <AutoLogoutPage onLogout={handleLogout} />;
            case 'deactivated':
                return (
                    <div className="flex h-screen bg-slate-100 items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md text-center bg-white p-8 rounded-2xl shadow-2xl">
                            <UserX size={48} className="mx-auto text-red-500 mb-4" />
                            <h1 className="text-2xl font-bold text-slate-800">Akun Dinonaktifkan</h1>
                            <p className="text-slate-600 mt-2 mb-6">Akun Anda telah dinonaktifkan. Silakan hubungi administrator untuk informasi lebih lanjut.</p>
                            <Button variant="danger" onClick={handleLogout}><LogOut size={16} className="mr-2" /> Logout</Button>
                        </motion.div>
                    </div>
                );
            case 'termination_pending':
                 return <TerminationConfirmationPage onConfirmAndProceedToLogout={handleConfirmAndProceedToLogout} />;
            case 'customer_catalog':
                 // FIX: Pass all required props to CatalogPage
                 return <CatalogPage 
                    onLogout={handleLogout}
                    products={finishedGoods}
                    onPlaceOrder={handlePlaceOrder}
                    currentUser={currentUser!}
                    onUpdateProfile={handleUpdateProfile}
                    cart={cart}
                    setCart={(newCart: SaleItem[]) => dispatch({ type: 'SET_CART', payload: newCart })}
                    poCart={poCart}
                    setPoCart={(newPoCart: SaleItem[]) => dispatch({ type: 'SET_PO_CART', payload: newPoCart })}
                    onlineOrders={onlineOrders}
                    bankAccounts={bankAccounts}
                    promoCodes={promoCodes}
                    sizingStandards={sizingStandards}
                    warrantyClaims={warrantyClaims}
                    garmentPatterns={garmentPatterns}
                 />;
            case 'dashboard':
                return renderDashboard();
            default:
                return null;
        }
    };

    return (
        <div className="relative h-screen">
            <AnimatePresence>
                <motion.div
                    key={currentView}
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                    {renderCurrentView()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

const App = () => (
    <AppProvider>
        {/* FIX: Correctly nest providers. The ToastProvider must wrap the PrintProvider since the print functionality uses toasts. The PrintProvider must wrap AppContent so that pages can trigger the print preview. This resolves errors about missing children props by ensuring the component tree is correctly structured. */}
        <ToastProvider>
            <PrintProvider>
                <AppContent />
            </PrintProvider>
        </ToastProvider>
    </AppProvider>
);

export default App;