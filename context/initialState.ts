// context/initialState.ts
import {
    INITIAL_USERS, INITIAL_REPORTS, INITIAL_SALES, INITIAL_INVENTORY, INITIAL_ONLINE_ORDERS, 
    INITIAL_STOCK_HISTORY, INITIAL_MESSAGES, INITIAL_MATERIALS, INITIAL_SIZING_STANDARDS, 
    INITIAL_BANK_ACCOUNTS, INITIAL_PROMO_CODES, INITIAL_PRODUCT_DISCOUNTS, INITIAL_SURVEY_RESPONSES, 
    INITIAL_ATTENDANCE, INITIAL_PERFORMANCE_STATUSES, INITIAL_SURVEY_QUESTIONS, INITIAL_PRODUCTION_REQUESTS, 
    INITIAL_FINISHED_GOODS, INITIAL_STOCK_ADJUSTMENTS, INITIAL_CUSTOMER_VOUCHERS, 
    INITIAL_PAYROLL_HISTORY, INITIAL_PRAYER_RECORDS, INITIAL_WARRANTY_CLAIMS, INITIAL_COMPANY_INFO,
    INITIAL_GARMENT_PATTERNS, INITIAL_ACCOUNT_CHANGE_REQUESTS
} from '../lib/data';

import type { AppState, AdditionalCost } from '../types';

const defaultState: AppState = {
    currentUser: null,
    users: INITIAL_USERS,
    lastLoggedInUsers: [],
    activityLog: [],
    messages: INITIAL_MESSAGES,
    productionReports: INITIAL_REPORTS,
    sales: INITIAL_SALES,
    inventory: INITIAL_INVENTORY,
    stockHistory: INITIAL_STOCK_HISTORY,
    productionRequests: INITIAL_PRODUCTION_REQUESTS,
    onlineOrders: INITIAL_ONLINE_ORDERS,
    materials: INITIAL_MATERIALS,
    finishedGoods: INITIAL_FINISHED_GOODS,
    sizingStandards: INITIAL_SIZING_STANDARDS,
    stockAdjustments: INITIAL_STOCK_ADJUSTMENTS,
    bankAccounts: INITIAL_BANK_ACCOUNTS,
    promoCodes: INITIAL_PROMO_CODES,
    productDiscounts: INITIAL_PRODUCT_DISCOUNTS,
    customerVouchers: INITIAL_CUSTOMER_VOUCHERS,
    payrollHistory: INITIAL_PAYROLL_HISTORY,
    surveyResponses: INITIAL_SURVEY_RESPONSES,
    surveyQuestions: INITIAL_SURVEY_QUESTIONS,
    attendanceRecords: INITIAL_ATTENDANCE,
    performanceStatuses: INITIAL_PERFORMANCE_STATUSES,
    prayerRecords: INITIAL_PRAYER_RECORDS,
    warrantyClaims: INITIAL_WARRANTY_CLAIMS,
    cart: [],
    poCart: [],
    page: null,
    viewingEmployeeId: null,
    chats: {},
    companyInfo: INITIAL_COMPANY_INFO,
    garmentPatterns: INITIAL_GARMENT_PATTERNS,
    accountChangeRequests: INITIAL_ACCOUNT_CHANGE_REQUESTS,
    stockThresholds: { materials: 20, finishedGoods: 10 },
    standardProductionCosts: [{ id: 'std-cost-1', name: 'Benang & Label', cost: 2500 }],
    standardProfitMargin: 70,
};

export const getInitialState = (): AppState => {
    try {
        const storedState = localStorage.getItem('kazumi_appState');
        if (storedState) {
            const parsedState = JSON.parse(storedState);
            
            // Re-hydrate function components that are lost during JSON serialization
            if (parsedState.garmentPatterns) {
                for (const key in parsedState.garmentPatterns) {
                    if (defaultState.garmentPatterns[key] && defaultState.garmentPatterns[key].icon) {
                        // Restore the icon component from the default state
                        parsedState.garmentPatterns[key].icon = defaultState.garmentPatterns[key].icon;
                    }
                }
            }

            return {
                ...defaultState,
                ...parsedState,
                // Ensure currentUser isn't stuck if page is reloaded
                currentUser: null 
            };
        }
    } catch (error) {
        console.error("Could not parse state from localStorage:", error);
    }
    return defaultState;
};

export const initialState = getInitialState();