// lib/expeditionApi.ts
import type { Address, SaleItem } from '../types';

export interface ShippingOption {
    code: string;
    service: string;
    description: string;
    cost: number;
    etd: string;
}

export interface TrackingHistory {
    timestamp: string;
    status: string;
    location: string;
}

// Menggunakan URL relatif yang akan di-proxy oleh Firebase Hosting ke Cloud Function
const SERVER_URL = '/api';

// Helper untuk memformat item agar sesuai dengan payload API Biteship
const formatItemsForBiteship = (items: SaleItem[]) => {
    return items.map(item => ({
        name: item.name,
        description: item.name,
        value: item.price,
        length: 20, // Dimensi default dalam cm
        width: 15,  // Dimensi default dalam cm
        height: 5,   // Dimensi default dalam cm
        weight: item.weight, // Menggunakan berat aktual dari item
        quantity: item.quantity,
    }));
};

/**
 * Mengambil opsi ongkos kirim dari backend proxy yang terhubung ke Biteship.
 * @param destination - Objek alamat tujuan.
 * @param items - Array item dalam keranjang.
 * @returns Promise yang berisi array opsi pengiriman.
 */
export const getShippingCosts = async (destination: Address, items: SaleItem[]): Promise<ShippingOption[]> => {
    if (!destination || !destination.postalCode || !items || items.length === 0) {
        console.error('Kode pos tujuan atau item belanja tidak lengkap untuk kalkulasi ongkir.');
        return [];
    }

    try {
        // HITUNG: Total berat dalam gram. API membutuhkan ini sebagai ganti detail item.
        const totalWeight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);

        const response = await fetch(`${SERVER_URL}/shipping-cost`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                destinationPostalCode: destination.postalCode,
                // KIRIM: Nama kota dan total berat sesuai pesan error dari API.
                destinationAreaName: destination.city,
                weight: totalWeight, 
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Gagal mengambil data dari server proxy.');
        }

        const data = await response.json();

        if (data.success && data.pricing) {
            return data.pricing.map((option: any) => ({
                code: option.courier_code,
                service: option.courier_service_code,
                description: option.courier_service_name,
                cost: option.price,
                etd: option.estimation_of_delivery || 'N/A',
            }));
        }
        return [];
    } catch (error) {
        console.error("Error fetching shipping costs:", error);
        return [];
    }
};

/**
 * Mengambil riwayat pelacakan paket dari backend proxy.
 * @param trackingNumber - Nomor resi paket.
 * @param courier - Kode kurir (misalnya, 'jne', 'jnt').
 * @returns Promise yang berisi riwayat pelacakan.
 */
export const trackPackage = async (trackingNumber: string, courier: string): Promise<TrackingHistory[]> => {
    if (!trackingNumber || !courier) {
        console.error('Nomor resi atau kurir tidak ada untuk pelacakan.');
        return [];
    }

    try {
        const response = await fetch(`${SERVER_URL}/track-package`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trackingNumber, courier }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Gagal mengambil data dari server proxy.');
        }

        const data = await response.json();
        
        if (data.success && data.history) {
            return data.history.map((item: any) => ({
                timestamp: item.updated_at,
                status: item.note,
                location: item.location || '',
            })).sort((a: TrackingHistory, b: TrackingHistory) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
        return [];

    } catch (error) {
        console.error("Error fetching tracking data:", error);
        return [];
    }
};