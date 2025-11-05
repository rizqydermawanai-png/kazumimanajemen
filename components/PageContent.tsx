// components/PageContent.tsx
import React, { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';

import { RecapitulationPage } from '../pages/Recapitulation';
import { ProductionPage } from '../pages/Production';
import { WarehousePage } from '../pages/Warehouse';
import { SalesPage } from '../pages/Sales';
import { ReportsPage } from '../pages/Reports';
import { SettingsPage } from '../pages/Settings';
import { MessageBoardPage } from '../pages/MessageBoard';
import { ActivityLogPage } from '../pages/ActivityLog';
import { SizingStandardsPage } from '../pages/SizingStandardsPage';
import { PromoPage } from '../pages/PromoPage';
import { LoyalCustomersPage } from '../pages/LoyalCustomersPage';
import { PayrollPage } from '../pages/PayrollPage';
import { SurveyPage } from '../pages/SurveyPage';
import { AttendancePage } from '../pages/AttendancePage';
import { PerformanceDashboardPage } from '../pages/PerformanceStatusPage';
import { MySalaryPage } from '../pages/MySalaryPage';
import { SopPage } from '../pages/SopPage';
import { PrayerReportPage } from '../pages/PrayerReportPage';
import { EmployeePerformanceDetailPage } from '../pages/EmployeePerformanceDetailPage';
import { WarrantyClaimsPage } from '../pages/WarrantyClaimsPage';
// FIX: Import hooks and types needed for props
import { useToast } from '../hooks/useToast';
import { usePrintPreview } from './PrintProvider';
import { StockHistoryType } from '../types';


// FIX: Accept onOpenPrayerModal as a prop
export const PageContent = ({ onOpenPrayerModal }: { onOpenPrayerModal: () => void }) => {
    const { state, dispatch } = useAppContext();
    const { page, viewingEmployeeId, users, currentUser, garmentPatterns } = state;
    const { addToast } = useToast();
    const { showPrintPreview } = usePrintPreview();

    if (!currentUser) {
        return null; // Or a loading/error state
    }

    const handleBackToAccountManagement = useCallback(() => {
        dispatch({ type: 'SET_PAGE', payload: 'accountManagement' });
        dispatch({ type: 'SET_VIEWING_EMPLOYEE_ID', payload: null });
    }, [dispatch]);

    // FIX: Memoize callback functions with useCallback to prevent unnecessary re-renders.
    const addActivity = useCallback((type: string, description: string, relatedId?: string) => {
        dispatch({ type: 'ADD_ACTIVITY', payload: { type, description, relatedId } });
    }, [dispatch]);

    const updateStock = useCallback((updates: { itemId: string; quantityChange: number; type: StockHistoryType; notes: string }[]) => {
        for (const update of updates) {
            if (update.quantityChange < 0) {
                const material = state.materials.find(m => m.id === update.itemId);
                if (material && material.stock < Math.abs(update.quantityChange)) {
                    addToast({ title: 'Stok Tidak Cukup', message: `Stok material ${material.name} tidak mencukupi.`, type: 'error' });
                    return false;
                }
                const good = state.finishedGoods.find(g => g.id === update.itemId);
                if (good && good.stock < Math.abs(update.quantityChange)) {
                    addToast({ title: 'Stok Tidak Cukup', message: `Stok produk ${good.name} tidak mencukupi.`, type: 'error' });
                    return false;
                }
            }
        }
        dispatch({ type: 'UPDATE_STOCK', payload: updates });
        return true;
    }, [dispatch, state.materials, state.finishedGoods, addToast]);
    
    // ---- START: Memoizing all dispatch-related props to fix re-render loops ----
    const setProductionReports = useCallback((payload) => dispatch({ type: 'SET_PRODUCTION_REPORTS', payload }), [dispatch]);
    const setProductionRequests = useCallback((payload) => dispatch({ type: 'SET_PRODUCTION_REQUESTS', payload }), [dispatch]);
    const setMaterials = useCallback((payload) => dispatch({ type: 'SET_MATERIALS', payload }), [dispatch]);
    const setFinishedGoods = useCallback((payload) => dispatch({ type: 'SET_FINISHED_GOODS', payload }), [dispatch]);
    const addStockHistory = useCallback((itemId, itemName, type, quantityChange, finalStock, notes) => dispatch({ type: 'UPDATE_STOCK', payload: [{ itemId, quantityChange, type, notes }] }), [dispatch]);
    const receiveProductionGoods = useCallback((payload) => dispatch({ type: 'RECEIVE_PRODUCTION_GOODS', payload }), [dispatch]);
    const setStockAdjustments = useCallback((payload) => dispatch({ type: 'SET_STOCK_ADJUSTMENTS', payload }), [dispatch]);
    const onDispatchOrder = useCallback((order, trackingNumber) => dispatch({ type: 'DISPATCH_ONLINE_ORDER', payload: { order, trackingNumber } }), [dispatch]);
    const onApprovePayment = useCallback((orderId) => dispatch({ type: 'APPROVE_PAYMENT', payload: { orderId } }), [dispatch]);
    const setSales = useCallback((payload) => dispatch({ type: 'SET_SALES', payload }), [dispatch]);
    const setCurrentUser = useCallback((payload) => dispatch({ type: 'UPDATE_CURRENT_USER', payload }), [dispatch]);
    const setUsers = useCallback((payload) => dispatch({ type: 'SET_USERS', payload }), [dispatch]);
    const setBankAccounts = useCallback((payload) => dispatch({ type: 'SET_BANK_ACCOUNTS', payload }), [dispatch]);
    const setMessages = useCallback((payload) => dispatch({ type: 'SET_MESSAGES', payload }), [dispatch]);
    const onViewEmployeePerformance = useCallback((userId) => {
        dispatch({ type: 'SET_PAGE', payload: 'employeePerformanceDetail' });
        dispatch({ type: 'SET_VIEWING_EMPLOYEE_ID', payload: userId });
    }, [dispatch]);
    const setPromoCodes = useCallback((payload) => dispatch({ type: 'SET_PROMO_CODES', payload }), [dispatch]);
    const setProductDiscounts = useCallback((payload) => dispatch({ type: 'SET_PRODUCT_DISCOUNTS', payload }), [dispatch]);
    const setCustomerVouchers = useCallback((payload) => dispatch({ type: 'SET_CUSTOMER_VOUCHERS', payload }), [dispatch]);
    const setPayrollHistory = useCallback((payload) => dispatch({ type: 'SET_PAYROLL_HISTORY', payload }), [dispatch]);
    const setAttendanceRecords = useCallback((payload) => dispatch({ type: 'SET_ATTENDANCE_RECORDS', payload }), [dispatch]);
    // ---- END: Memoizing all dispatch-related props ----


    switch (page) {
        case 'recapitulation': return <RecapitulationPage />;
        case 'production': return <ProductionPage 
            materials={state.materials}
            productionReports={state.productionReports}
            setProductionReports={setProductionReports}
            currentUser={currentUser}
            addActivity={addActivity}
            updateStock={updateStock}
            sizingStandards={state.sizingStandards}
            productionRequests={state.productionRequests}
            setProductionRequests={setProductionRequests}
            users={users}
            finishedGoods={state.finishedGoods}
            garmentPatterns={garmentPatterns}
        />;
        case 'warehouse': return <WarehousePage 
            materials={state.materials}
            setMaterials={setMaterials}
            addActivity={addActivity}
            productionReports={state.productionReports}
            setProductionReports={setProductionReports}
            finishedGoods={state.finishedGoods}
            setFinishedGoods={setFinishedGoods}
            onlineOrders={state.onlineOrders}
            stockHistory={state.stockHistory}
            updateStock={updateStock}
            currentUser={currentUser}
            addStockHistory={addStockHistory}
            receiveProductionGoods={receiveProductionGoods}
            stockAdjustments={state.stockAdjustments}
            setStockAdjustments={setStockAdjustments}
            productionRequests={state.productionRequests}
            setProductionRequests={setProductionRequests}
            onDispatchOrder={onDispatchOrder}
            onApprovePayment={onApprovePayment}
            users={users}
            garmentPatterns={state.garmentPatterns}
        />;
        case 'salesCalculator': return <SalesPage 
            sales={state.sales}
            setSales={setSales}
            currentUser={currentUser}
            addActivity={addActivity}
            finishedGoods={state.finishedGoods}
            updateStock={updateStock}
            promoCodes={state.promoCodes}
        />;
        case 'report': return <ReportsPage />;
        case 'warrantyClaims': return <WarrantyClaimsPage />;
        case 'payroll': return <PayrollPage 
            currentUser={currentUser}
            users={users}
            setUsers={setUsers}
            payrollHistory={state.payrollHistory}
            setPayrollHistory={setPayrollHistory}
            addActivity={addActivity}
        />;
        case 'surveys': return <SurveyPage />;
        case 'promo': return <PromoPage
            currentUser={currentUser}
            addActivity={addActivity}
            promoCodes={state.promoCodes}
            setPromoCodes={setPromoCodes}
            productDiscounts={state.productDiscounts}
            setProductDiscounts={setProductDiscounts}
            finishedGoods={state.finishedGoods}
            users={users}
        />;
        case 'loyalCustomers': return <LoyalCustomersPage
            currentUser={currentUser}
            users={users}
            sales={state.sales}
            promoCodes={state.promoCodes}
            customerVouchers={state.customerVouchers}
            setCustomerVouchers={setCustomerVouchers}
            addActivity={addActivity}
        />;
        case 'messageBoard': return <MessageBoardPage />;
        case 'activityLogs': return <ActivityLogPage />;
        case 'sizingStandards': return <SizingStandardsPage />;
        case 'myProfile':
        case 'accountManagement':
        case 'companySettings':
        case 'stockSettings':
        case 'productionSettings':
            return <SettingsPage 
                initialTab={page as 'myProfile' | 'accountManagement' | 'companySettings' | 'stockSettings' | 'productionSettings'}
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                users={users}
                setUsers={setUsers}
                addActivity={addActivity}
                bankAccounts={state.bankAccounts}
                setBankAccounts={setBankAccounts}
                showPrintPreview={showPrintPreview}
                messages={state.messages}
                setMessages={setMessages}
                onViewEmployeePerformance={onViewEmployeePerformance}
            />;
        case 'attendance': return <AttendancePage
            attendanceRecords={state.attendanceRecords}
            setAttendanceRecords={setAttendanceRecords}
            users={users}
            performanceStatuses={state.performanceStatuses}
            addActivity={addActivity}
        />;
        case 'performanceDashboard': return <PerformanceDashboardPage />;
        case 'mySalary': return <MySalaryPage />;
        case 'sop': return <SopPage />;
        case 'prayerReport': return <PrayerReportPage onOpenModal={onOpenPrayerModal} />;
        case 'employeePerformanceDetail':
            if (!viewingEmployeeId) {
                // Fallback to account management if no employee is selected
                return <SettingsPage 
                    initialTab={'accountManagement'}
                    currentUser={currentUser}
                    setCurrentUser={setCurrentUser}
                    users={users}
                    setUsers={setUsers}
                    addActivity={addActivity}
                    bankAccounts={state.bankAccounts}
                    setBankAccounts={setBankAccounts}
                    showPrintPreview={showPrintPreview}
                    messages={state.messages}
                    setMessages={setMessages}
                    onViewEmployeePerformance={onViewEmployeePerformance}
                />;
            }
            const employee = users.find(u => u.uid === viewingEmployeeId);
            if (!employee) {
                // Fallback if employee data is not found
                return <SettingsPage 
                    initialTab={'accountManagement'}
                    currentUser={currentUser}
                    setCurrentUser={setCurrentUser}
                    users={users}
                    setUsers={setUsers}
                    addActivity={addActivity}
                    bankAccounts={state.bankAccounts}
                    setBankAccounts={setBankAccounts}
                    showPrintPreview={showPrintPreview}
                    messages={state.messages}
                    setMessages={setMessages}
                    onViewEmployeePerformance={onViewEmployeePerformance}
                />;
            }
            return <EmployeePerformanceDetailPage userId={viewingEmployeeId} onBack={handleBackToAccountManagement} />;
        default: return <RecapitulationPage />;
    }
};