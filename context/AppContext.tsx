// context/AppContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
// FIX: Import `AppState` from `../types` where it is defined and exported, not from `initialState`.
import { initialState } from './initialState';
import { ActionType } from './actions';
import type { AppState, StockHistoryType, ActivityLog, StockHistoryEntry, UserData, AttendanceRecord, PrayerRecord, PrayerName, AccountChangeRequest, OnlineOrderStatus, OnlineOrder } from '../types';
import { getPrayerTimes } from '../lib/prayerTimes';
import { generateSequentialId } from '../lib/utils';
import { calculatePerformanceScore } from '../lib/performance';

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<ActionType> }>({
    state: initialState,
    dispatch: () => null,
});

// FIX: Export useAppContext hook
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};

const appReducer = (state: AppState, action: ActionType): AppState => {
    // Helper function to add activity log
    const addActivity = (type: string, description: string, relatedId?: string): ActivityLog[] => {
        const userId = state.currentUser ? state.currentUser.uid : 'system';
        const newLog: ActivityLog = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), userId, type, description, relatedId };
        return [newLog, ...state.activityLog.slice(0, 499)];
    };
    
    // Helper function to add stock history
    const addStockHistory = (
        currentStockHistory: StockHistoryEntry[],
        itemId: string,
        itemName: string,
        type: StockHistoryType,
        quantityChange: number,
        finalStock: number,
        notes: string
    ): StockHistoryEntry[] => {
        const userId = state.currentUser ? state.currentUser.uid : 'system';
        const newHistory: StockHistoryEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            productId: itemId,
            productName: itemName,
            type: type,
            quantity: quantityChange,
            finalStock: finalStock,
            source: notes,
            userId: userId,
        };
        return [newHistory, ...currentStockHistory];
    };
    
    // Recalculate performance score helper
    const recalculateAllUserScores = (currentState: AppState): UserData[] => {
        return currentState.users.map(user => {
            if (['member', 'admin', 'kepala_gudang', 'kepala_produksi', 'kepala_penjualan', 'penjualan'].includes(user.role)) {
                const { score, history } = calculatePerformanceScore(user, currentState.attendanceRecords, currentState.prayerRecords);
                return { ...user, performanceScore: score, pointHistory: history };
            }
            return user;
        });
    };

    switch (action.type) {
        case 'LOGIN': {
            const user = action.payload;
            let lastUsers = state.lastLoggedInUsers.filter(u => u.uid !== user.uid);
            lastUsers.unshift({ uid: user.uid, username: user.username });
            
            const getInitialPage = () => {
                if (!user || user.role === 'customer') return null;
                if (user.role === 'super_admin') return 'recapitulation';
                if (user.role === 'kepala_gudang') return 'warehouse';
                if (user.role === 'kepala_produksi') return 'production';
                if (user.role === 'kepala_penjualan' || user.role === 'penjualan') return 'salesCalculator';
                if (user.department === 'gudang') return 'warehouse';
                if (user.department === 'penjualan') return 'salesCalculator';
                return 'production';
            };
            const initialPage = getInitialPage();

            return {
                ...state,
                currentUser: user,
                page: initialPage, // Set initial page atomically with login
                lastLoggedInUsers: lastUsers.slice(0, 5),
                activityLog: addActivity('Manajemen Akun', `Pengguna ${user.username} berhasil login.`)
            };
        }
        case 'LOGOUT':
            return {
                ...state,
                currentUser: null,
                cart: [],
                activityLog: state.currentUser ? addActivity('Manajemen Akun', `Pengguna ${state.currentUser.username} logout.`) : state.activityLog
            };

        case 'REGISTER_STAFF':
        case 'REGISTER_CUSTOMER': {
            const newUser = action.payload.user;
            return {
                ...state,
                users: [...state.users, newUser],
                activityLog: addActivity('Manajemen Akun', `Akun baru mendaftar: ${newUser.username}`, newUser.uid)
            };
        }
        
        case 'ADD_ACTIVITY': {
            const { type, description, relatedId } = action.payload;
            return {
                ...state,
                activityLog: addActivity(type, description, relatedId),
            };
        }

        case 'UPDATE_CURRENT_USER': {
            const newCurrentUser = typeof action.payload === 'function' ? action.payload(state.currentUser!) : action.payload;
            if (!newCurrentUser) { 
                return state;
            }
            return {
                ...state,
                currentUser: newCurrentUser,
                users: state.users.map(u => u.uid === newCurrentUser.uid ? newCurrentUser : u),
                activityLog: addActivity('Manajemen Akun', 'Memperbarui profil pribadi.')
            };
        }

        case 'UPDATE_STOCK': {
            let newMaterials = [...state.materials];
            let newFinishedGoods = [...state.finishedGoods];
            let newStockHistory = [...state.stockHistory];

            for (const update of action.payload) {
                const { itemId, quantityChange, type, notes } = update;
                
                const materialIndex = newMaterials.findIndex(m => m.id === itemId);
                if (materialIndex > -1) {
                    const material = newMaterials[materialIndex];
                    const newStock = material.stock + quantityChange;
                    newMaterials[materialIndex] = { ...material, stock: newStock };
                    newStockHistory = addStockHistory(newStockHistory, itemId, material.name, type, quantityChange, newStock, notes);
                    continue;
                }

                const goodIndex = newFinishedGoods.findIndex(g => g.id === itemId);
                if (goodIndex > -1) {
                    const good = newFinishedGoods[goodIndex];
                    const newStock = good.stock + quantityChange;
                    newFinishedGoods[goodIndex] = { ...good, stock: newStock };
                    newStockHistory = addStockHistory(newStockHistory, itemId, `${good.name} ${good.size} (${good.colorName})`, type, quantityChange, newStock, notes);
                }
            }
            return { ...state, materials: newMaterials, finishedGoods: newFinishedGoods, stockHistory: newStockHistory };
        }
        
        case 'RECEIVE_PRODUCTION_GOODS': {
            const report = action.payload;
            let updatedGoodsState = [...state.finishedGoods];
            let newStockHistory = [...state.stockHistory];

            report.hppResult.garmentOrder.forEach(orderItem => {
                const goodId = `${report.selectedGarment}-${orderItem.model}-${orderItem.size}-${orderItem.colorName}`.replace(/\s+/g, '-').toLowerCase();
                const existingGoodIndex = updatedGoodsState.findIndex(g => g.id === goodId);
                const itemName = `${report.selectedGarment} ${orderItem.model || ''}`.trim();

                const garmentPatternKey = Object.keys(state.garmentPatterns).find(key => state.garmentPatterns[key].title === report.selectedGarment);
                const garmentPattern = garmentPatternKey ? state.garmentPatterns[garmentPatternKey] : null;

                if (existingGoodIndex > -1) {
                    const newStock = updatedGoodsState[existingGoodIndex].stock + orderItem.quantity;
                    updatedGoodsState[existingGoodIndex].stock = newStock;
                    newStockHistory = addStockHistory(newStockHistory, goodId, `${itemName} ${orderItem.size} (${orderItem.colorName})`, 'in-production', orderItem.quantity, newStock, `Masuk dari produksi #${report.id}`);
                } else {
                    const newGood = {
                        id: goodId,
                        productionReportId: report.id, name: itemName, model: orderItem.model || '',
                        size: orderItem.size, colorName: orderItem.colorName, colorCode: orderItem.colorCode,
                        stock: orderItem.quantity, hpp: report.hppResult.hppPerGarment, sellingPrice: report.hppResult.sellingPricePerGarment,
                        imageUrls: [],
                        weight: garmentPattern?.defaultWeight || 250, // Default weight in grams
                    };
                    updatedGoodsState.push(newGood);
                    newStockHistory = addStockHistory(newStockHistory, goodId, `${newGood.name} ${newGood.size} (${newGood.colorName})`, 'in-production', newGood.stock, newGood.stock, `Masuk dari produksi #${report.id}`);
                }
            });
            
            return {
                ...state,
                finishedGoods: updatedGoodsState,
                stockHistory: newStockHistory,
                productionReports: state.productionReports.map(r => r.id === report.id ? { ...r, isReceivedInWarehouse: true } : r),
                activityLog: addActivity('Gudang', `Menerima barang dari produksi #${report.id}`, report.id)
            };
        }
        
        case 'DISPATCH_ONLINE_ORDER': {
            const { order, trackingNumber } = action.payload;
            const subtotal = order.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
            
            const newSale = {
                id: generateSequentialId('INV'),
                timestamp: new Date().toISOString(),
                userId: state.currentUser!.uid,
                customerName: order.customerName,
                items: order.items,
                result: { subtotal, discountAmount: 0, taxAmount: 0, grandTotal: subtotal },
                type: 'online' as const,
                status: 'selesai' as const,
                onlineOrderId: order.id,
            };
            
            const updatedOnlineOrders = state.onlineOrders.map(o => o.id === order.id ? {
                ...o, status: 'siap_kirim' as const, trackingNumber,
                history: [...o.history, { status: 'siap_kirim' as const, timestamp: new Date().toISOString(), userId: state.currentUser!.uid }]
            } : o);
            
            return {
                ...state,
                sales: [newSale, ...state.sales],
                onlineOrders: updatedOnlineOrders,
                activityLog: addActivity('Gudang', `Mengirim pesanan online #${order.id}`, order.id)
            };
        }
        
        case 'PLACE_ONLINE_ORDER': {
            const { orderInfo, cart } = action.payload;
            const newOrder: OnlineOrder = {
                id: generateSequentialId('ORD'),
                timestamp: new Date().toISOString(),
                customerName: orderInfo.customerName,
                shippingAddress: orderInfo.shippingAddress,
                notes: orderInfo.notes,
                paymentMethod: orderInfo.paymentMethod,
                shippingMethod: orderInfo.shippingMethod,
                shippingCost: orderInfo.shippingCost,
                downPaymentProofUrl: orderInfo.paymentProofUrl,
                status: 'pending_payment' as const,
                items: cart,
                history: [{ status: 'pending_payment' as const, timestamp: new Date().toISOString(), userId: state.currentUser?.uid || null }],
                orderType: 'direct',
            };
            return {
                ...state,
                onlineOrders: [newOrder, ...state.onlineOrders],
                cart: [],
            };
        }

        case 'PLACE_PO_ORDER': {
             const { orderInfo, poCart } = action.payload;
             const poSubtotal = poCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
             const downPayment = poSubtotal * 0.5;

             const newPoOrder: OnlineOrder = {
                id: generateSequentialId('PO'),
                timestamp: new Date().toISOString(),
                customerName: orderInfo.customerName,
                shippingAddress: orderInfo.shippingAddress,
                notes: orderInfo.notes,
                paymentMethod: orderInfo.paymentMethod,
                shippingMethod: orderInfo.shippingMethod,
                shippingCost: orderInfo.shippingCost,
                downPaymentProofUrl: orderInfo.paymentProofUrl,
                status: 'pending_dp' as const,
                items: poCart,
                history: [{ status: 'pending_dp' as const, timestamp: new Date().toISOString(), userId: state.currentUser?.uid || null }],
                orderType: 'po',
                downPayment: downPayment,
                remainingPayment: poSubtotal - downPayment,
            };
             return {
                ...state,
                onlineOrders: [newPoOrder, ...state.onlineOrders],
                poCart: [],
            };
        }

        case 'APPROVE_PAYMENT': {
            const { orderId } = action.payload;
            return {
                ...state,
                onlineOrders: state.onlineOrders.map(o => o.id === orderId ? {
                    ...o,
                    status: 'pending_gudang' as const,
                    history: [...o.history, { status: 'pending_gudang' as const, timestamp: new Date().toISOString(), userId: state.currentUser!.uid }]
                } : o),
                activityLog: addActivity('Gudang', `Menyetujui pembayaran untuk pesanan #${orderId}`, orderId)
            };
        }
        
        case 'UPDATE_ORDER_STATUS': {
            const { orderId, status, assigneeId, estimatedCompletionDate } = action.payload;
             return {
                ...state,
                onlineOrders: state.onlineOrders.map(o => o.id === orderId ? {
                    ...o,
                    status,
                    ...(assigneeId && { assignedTo: assigneeId }),
                    ...(estimatedCompletionDate && { estimatedCompletionDate }),
                    history: [...o.history, { status, timestamp: new Date().toISOString(), userId: state.currentUser!.uid }]
                } : o),
            };
        }
        
        case 'ADD_ATTENDANCE': {
            const { status, proof } = action.payload;
            const newRecord: AttendanceRecord = {
                id: crypto.randomUUID(),
                userId: state.currentUser!.uid,
                date: new Date().toISOString().split('T')[0],
                status: status,
                proof: proof,
                clockInTimestamp: new Date().toISOString(),
            };
            const newState = {
                ...state,
                attendanceRecords: [...state.attendanceRecords, newRecord],
                activityLog: addActivity('Absensi', `Mencatat kehadiran sebagai ${status}`)
            };
            // Recalculate scores after updating records
            return { ...newState, users: recalculateAllUserScores(newState) };
        }
        
        case 'CLOCK_OUT': {
            const { attendanceId, clockOutTime } = action.payload;
            return {
                ...state,
                attendanceRecords: state.attendanceRecords.map(rec => 
                    rec.id === attendanceId ? { ...rec, clockOutTimestamp: clockOutTime } : rec
                )
            };
        }
        
        case 'ADD_PRAYER_RECORD': {
             const { prayerName, photoProof } = action.payload;
             const now = new Date();
             const prayerTimes = getPrayerTimes(now);
             const prayerTime = prayerTimes[prayerName.toLowerCase() as keyof typeof prayerTimes];
             const isLate = (now.getTime() - prayerTime.getTime()) > 15 * 60 * 1000; // 15 min tolerance

             const newRecord: PrayerRecord = {
                id: crypto.randomUUID(),
                userId: state.currentUser!.uid,
                date: now.toISOString().split('T')[0],
                prayerName,
                timestamp: now.toISOString(),
                photoProof,
                status: isLate ? 'late' : 'on_time',
            };
            const newState = {
                ...state,
                prayerRecords: [...state.prayerRecords, newRecord],
            };
            return { ...newState, users: recalculateAllUserScores(newState) };
        }
        
        case 'SUBMIT_SURVEY': {
            const newResponse = {
                id: crypto.randomUUID(),
                surveyId: 'annual',
                userId: state.currentUser!.uid,
                submittedAt: new Date().toISOString(),
                answers: action.payload.answers,
            };
            return {
                ...state,
                surveyResponses: [...state.surveyResponses, newResponse],
                currentUser: { ...state.currentUser!, lastSurveyDate: new Date().toISOString() },
                users: state.users.map(u => u.uid === state.currentUser!.uid ? { ...u, lastSurveyDate: new Date().toISOString() } : u),
            };
        }
        
        case 'CONFIRM_SALARY': {
            const payrollId = action.payload;
            return {
                ...state,
                payrollHistory: state.payrollHistory.map(p => 
                    p.id === payrollId ? { ...p, status: 'confirmed', confirmedAt: new Date().toISOString() } : p
                ),
            };
        }
        
        case 'SUBMIT_WARRANTY_CLAIM': {
            return { ...state, warrantyClaims: [...state.warrantyClaims, action.payload] };
        }

        case 'UPDATE_WARRANTY_CLAIM_STATUS': {
            const { claimId, status, adminNotes } = action.payload;
            return {
                ...state,
                warrantyClaims: state.warrantyClaims.map(c => 
                    c.id === claimId 
                    ? { ...c, status, adminNotes, reviewedBy: state.currentUser!.uid, reviewedAt: new Date().toISOString() } 
                    : c
                ),
            };
        }

        case 'SEND_CHAT_MESSAGE': {
            const { customerUid, message } = action.payload;
            const newChats = { ...state.chats };
            if (!newChats[customerUid]) {
                const customer = state.users.find(u => u.uid === customerUid);
                newChats[customerUid] = { customerName: customer?.fullName || 'Pelanggan', messages: [] };
            }
            newChats[customerUid].messages.push(message);
            return { ...state, chats: newChats };
        }

        case 'MARK_CHAT_AS_READ': {
            const { customerUid, reader } = action.payload;
            const newChats = { ...state.chats };
            if (newChats[customerUid]) {
                newChats[customerUid].messages = newChats[customerUid].messages.map(msg => ({
                    ...msg,
                    ...(reader === 'admin' && { readByAdmin: true }),
                    ...(reader === 'customer' && { readByCustomer: true }),
                }));
            }
            return { ...state, chats: newChats };
        }
        
        default: {
            const simpleSetters: { [key: string]: keyof AppState } = {
                'SET_PAGE': 'page', 'SET_USERS': 'users', 'SET_CART': 'cart', 'SET_PO_CART': 'poCart', 'SET_MESSAGES': 'messages',
                'SET_PRODUCTION_REPORTS': 'productionReports', 'SET_SALES': 'sales', 'SET_MATERIALS': 'materials',
                'SET_FINISHED_GOODS': 'finishedGoods', 'SET_ONLINE_ORDERS': 'onlineOrders', 'SET_STOCK_HISTORY': 'stockHistory',
                'SET_PRODUCTION_REQUESTS': 'productionRequests', 'SET_SIZING_STANDARDS': 'sizingStandards',
                'SET_STOCK_ADJUSTMENTS': 'stockAdjustments', 'SET_BANK_ACCOUNTS': 'bankAccounts', 'SET_PROMO_CODES': 'promoCodes',
                'SET_PRODUCT_DISCOUNTS': 'productDiscounts', 'SET_CUSTOMER_VOUCHERS': 'customerVouchers',
                'SET_PAYROLL_HISTORY': 'payrollHistory', 'SET_SURVEY_RESPONSES': 'surveyResponses',
                'SET_SURVEY_QUESTIONS': 'surveyQuestions', 'SET_ATTENDANCE_RECORDS': 'attendanceRecords',
                'SET_WARRANTY_CLAIMS': 'warrantyClaims', 'SET_COMPANY_INFO': 'companyInfo',
                'SET_GARMENT_PATTERNS': 'garmentPatterns', 'SET_ACCOUNT_CHANGE_REQUESTS': 'accountChangeRequests',
                'SET_STOCK_THRESHOLDS': 'stockThresholds', 'SET_STANDARD_PRODUCTION_COSTS': 'standardProductionCosts',
                'SET_STANDARD_PROFIT_MARGIN': 'standardProfitMargin', 'SET_PRAYER_RECORDS': 'prayerRecords',
                'SET_CHATS': 'chats', 'SET_VIEWING_EMPLOYEE_ID': 'viewingEmployeeId'
            };

            if (action.type in simpleSetters) {
                const key = simpleSetters[action.type];
                // @ts-ignore
                const value = typeof action.payload === 'function' ? action.payload(state[key]) : action.payload;
                return { ...state, [key]: value };
            }
            
            return state;
        }
    }
};

// FIX: Export AppProvider component
export const AppProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    useEffect(() => {
        const handler = setTimeout(() => {
            try {
                // Persist state to localStorage, but don't save the current user session
                const stateToSave = { ...state, currentUser: null, page: null, viewingEmployeeId: null };
                localStorage.setItem('kazumi_appState', JSON.stringify(stateToSave));
            } catch (error) {
                console.error("Could not save state to localStorage:", error);
            }
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [state]);
    
    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};