// lib/api.ts
import type { Province, Regency, District, Village } from '../types';

const BASE_API_URL = 'https://www.emsifa.com/api-wilayah-indonesia/api';

async function fetchData<T>(endpoint: string): Promise<T> {
    try {
        const response = await fetch(`${BASE_API_URL}${endpoint}`);
        if (!response.ok) {
            throw new Error(`Gagal mengambil data dari ${endpoint}`);
        }
        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
}

export const getProvinces = (): Promise<Province[]> => {
    return fetchData<Province[]>('/provinces.json');
};

export const getRegencies = (provinceId: string): Promise<Regency[]> => {
    return fetchData<Regency[]>(`/regencies/${provinceId}.json`);
};

export const getDistricts = (regencyId: string): Promise<District[]> => {
    return fetchData<District[]>(`/districts/${regencyId}.json`);
};

export const getVillages = (districtId: string): Promise<Village[]> => {
    // Note: The public API might not have postal codes directly.
    // This is a common structure, but might need adjustment based on the exact API.
    // For this implementation, we assume a postal code is not available and will be handled manually.
    return fetchData<Village[]>(`/villages/${districtId}.json`);
};

// A mock function to get postal code since the public API doesn't provide it reliably.
// In a real-world scenario, you'd use a dedicated postal code API.
export const getPostalCode = async (villageId: string): Promise<string> => {
    // This is a placeholder. A real implementation would call another API.
    console.warn("getPostalCode is a mock function. Postal codes are not available from this API.");
    return "00000"; 
};