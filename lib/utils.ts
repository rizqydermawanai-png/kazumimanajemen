import type { UserData, Role, Department } from '../types';

/**
 * Formats a number into Indonesian Rupiah currency format.
 * @param amount The number to format.
 * @returns A formatted currency string (e.g., "Rp 10.000").
 */
export const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return "Rp 0";
    }
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Math.round(amount));
};

/**
 * Formats a date string or object into a localized Indonesian date-time string for UI display.
 * @param date The date to format.
 * @returns A formatted date string (e.g., "1 Agu 2024, 14.30").
 */
export const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('id-ID', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

/**
 * Formats a date string or object into a CSV-friendly format (YYYY-MM-DD HH:MM).
 * @param date The date to format.
 * @returns A formatted date string for export.
 */
export const formatDateForExport = (date: Date | string): string => {
    const d = new Date(date);
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * Formats a user role key into a human-readable title.
 * @param role The role key.
 * @returns The formatted role name.
 */
export const formatRole = (role?: Role | string) => ({
    'super_admin': 'CEO',
    'admin': 'Wakil CEO',
    'kepala_gudang': 'Kepala Gudang',
    'kepala_produksi': 'Kepala Produksi',
    'kepala_penjualan': 'Kepala Penjualan',
    'penjualan': 'Staf Penjualan',
    'penanggung_jawab': 'Penanggung Jawab',
    'user': 'Pengguna',
    'member': 'Anggota',
    'pending': 'Menunggu Persetujuan'
}[role || ''] || role);

/**
 * Formats a department key into a human-readable title.
 * @param dept The department key.
 * @returns The formatted department name.
 */
export const formatDepartment = (dept?: Department | string | null) => ({ 
    'produksi': 'Produksi', 
    'gudang': 'Gudang', 
    'penjualan': 'Penjualan' 
}[dept || ''] || dept);

/**
 * Retrieves a username from a list of users based on a user ID.
 * @param uid The user ID to look for.
 * @param users The array of user data.
 * @returns The username or a truncated UID if not found.
 */
export const getUsernameById = (uid: string, users: Pick<UserData, 'uid' | 'username'>[]) => {
    if (!uid) return 'Tidak Diketahui';
    const user = users.find(u => u.uid === uid);
    return user ? user.username : uid.substring(0, 8) + '...';
};

/**
 * Generates a sequential, date-based, and human-readable unique ID.
 * Format: PREFIX-YYYYMMDD-XXXX
 * @param prefix A short prefix for the ID type (e.g., 'PROD', 'INV').
 * @returns A unique ID string.
 */
export const generateSequentialId = (prefix: string) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    
    // Generates a 4-character random alphanumeric string
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    return `${prefix}-${year}${month}${day}-${randomPart}`;
};