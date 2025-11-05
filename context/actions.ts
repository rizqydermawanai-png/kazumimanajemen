// context/actions.ts
import type { SetStateAction } from 'react';
import type {
    UserData, Sale, ProductionReport, Message, Material, FinishedGood, OnlineOrder, OnlineOrderStatus,
    StockHistoryEntry, ProductionRequest, AllSizingStandards, StockAdjustment, BankAccount,
    PromoCode, ProductDiscount, CustomerVoucher, PayrollEntry, SurveyResponse, SurveyQuestion,
    AttendanceRecord, PrayerRecord, SaleItem, AttendanceStatus, PrayerName, SurveyAnswer,
    Department, WarrantyClaim, WarrantyClaimStatus, ChatMessage, ChatSession, CompanyInfo, GarmentPattern, AccountChangeRequest, AdditionalCost
} from '../types';

export type ActionType =
    | { type: 'LOGIN'; payload: UserData }
    | { type: 'LOGOUT' }
    | { type: 'REGISTER_STAFF'; payload: { user: UserData } }
    | { type: 'REGISTER_CUSTOMER'; payload: { user: UserData } }
    | { type: 'SET_PAGE'; payload: SetStateAction<string | null> }
    | { type: 'SET_VIEWING_EMPLOYEE_ID'; payload: string | null }
    | { type: 'UPDATE_CURRENT_USER'; payload: SetStateAction<UserData | null> }
    | { type: 'SET_USERS'; payload: SetStateAction<UserData[]> }
    | { type: 'ADD_ACTIVITY'; payload: { type: string; description: string; relatedId?: string } }
    | { type: 'UPDATE_STOCK'; payload: { itemId: string; quantityChange: number; type: any; notes: string }[] }
    | { type: 'RECEIVE_PRODUCTION_GOODS'; payload: ProductionReport }
    | { type: 'DISPATCH_ONLINE_ORDER'; payload: { order: OnlineOrder; trackingNumber: string } }
    | { type: 'PLACE_ONLINE_ORDER'; payload: { orderInfo: any; cart: SaleItem[]; } }
    | { type: 'PLACE_PO_ORDER'; payload: { orderInfo: any; poCart: SaleItem[]; } }
    | { type: 'APPROVE_PAYMENT'; payload: { orderId: string } }
    | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string; status: OnlineOrderStatus; assigneeId?: string; estimatedCompletionDate?: string; } }
    | { type: 'ADD_ATTENDANCE'; payload: { status: AttendanceStatus; proof: string } }
    | { type: 'CLOCK_OUT'; payload: { attendanceId: string; clockOutTime: string } }
    | { type: 'ADD_PRAYER_RECORD'; payload: { prayerName: PrayerName; photoProof: string } }
    | { type: 'SUBMIT_SURVEY'; payload: { answers: SurveyAnswer[] } }
    | { type: 'CONFIRM_SALARY'; payload: string }
    | { type: 'SUBMIT_WARRANTY_CLAIM'; payload: WarrantyClaim }
    | { type: 'UPDATE_WARRANTY_CLAIM_STATUS'; payload: { claimId: string; status: WarrantyClaimStatus; adminNotes: string } }
    | { type: 'SEND_CHAT_MESSAGE'; payload: { customerUid: string; message: ChatMessage } }
    | { type: 'MARK_CHAT_AS_READ'; payload: { customerUid: string; reader: 'admin' | 'customer' } }
    | { type: 'SET_CHATS'; payload: SetStateAction<ChatSession> }
    | { type: 'SET_CART'; payload: SetStateAction<SaleItem[]> }
    | { type: 'ADD_TO_PO_CART'; payload: { product: FinishedGood; quantity: number } }
    | { type: 'SET_PO_CART'; payload: SetStateAction<SaleItem[]> }
    | { type: 'SET_MESSAGES'; payload: SetStateAction<Message[]> }
    | { type: 'SET_PRODUCTION_REPORTS'; payload: SetStateAction<ProductionReport[]> }
    | { type: 'SET_SALES'; payload: SetStateAction<Sale[]> }
    | { type: 'SET_MATERIALS'; payload: SetStateAction<Material[]> }
    | { type: 'SET_FINISHED_GOODS'; payload: SetStateAction<FinishedGood[]> }
    | { type: 'SET_ONLINE_ORDERS'; payload: SetStateAction<OnlineOrder[]> }
    | { type: 'SET_STOCK_HISTORY'; payload: SetStateAction<StockHistoryEntry[]> }
    | { type: 'SET_PRODUCTION_REQUESTS'; payload: SetStateAction<ProductionRequest[]> }
    | { type: 'SET_SIZING_STANDARDS'; payload: SetStateAction<AllSizingStandards> }
    | { type: 'SET_STOCK_ADJUSTMENTS'; payload: SetStateAction<StockAdjustment[]> }
    | { type: 'SET_BANK_ACCOUNTS'; payload: SetStateAction<BankAccount[]> }
    | { type: 'SET_PROMO_CODES'; payload: SetStateAction<PromoCode[]> }
    | { type: 'SET_PRODUCT_DISCOUNTS'; payload: SetStateAction<ProductDiscount[]> }
    | { type: 'SET_CUSTOMER_VOUCHERS'; payload: SetStateAction<CustomerVoucher[]> }
    | { type: 'SET_PAYROLL_HISTORY'; payload: SetStateAction<PayrollEntry[]> }
    | { type: 'SET_SURVEY_RESPONSES'; payload: SetStateAction<SurveyResponse[]> }
    | { type: 'SET_SURVEY_QUESTIONS'; payload: SetStateAction<SurveyQuestion[]> }
    | { type: 'SET_ATTENDANCE_RECORDS'; payload: SetStateAction<AttendanceRecord[]> }
    | { type: 'SET_WARRANTY_CLAIMS'; payload: SetStateAction<WarrantyClaim[]> }
    | { type: 'SET_COMPANY_INFO'; payload: CompanyInfo }
    | { type: 'SET_GARMENT_PATTERNS'; payload: SetStateAction<{ [key: string]: GarmentPattern }> }
    | { type: 'SET_ACCOUNT_CHANGE_REQUESTS'; payload: SetStateAction<AccountChangeRequest[]> }
    | { type: 'SET_STOCK_THRESHOLDS'; payload: { materials: number; finishedGoods: number } }
    | { type: 'SET_STANDARD_PRODUCTION_COSTS'; payload: AdditionalCost[] }
    | { type: 'SET_STANDARD_PROFIT_MARGIN'; payload: number }
    | { type: 'SET_PRAYER_RECORDS'; payload: SetStateAction<PrayerRecord[]> };