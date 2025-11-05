
// server.mjs
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const port = 3001; // Port untuk server proxy

app.use(cors());
app.use(express.json());

// --- KONFIGURASI BITESHP ---
// Mengambil API Key dari environment variable untuk keamanan yang lebih baik
// FIX: Corrected typo in environment variable access from 'BITESHIP_API_KEY' to 'BITESHP_API_KEY'.
const BITESHP_API_KEY = process.env.BITESHP_API_KEY;
const BITESHP_BASE_URL = 'https://api.biteship.com';

// Memastikan API Key tersedia saat server dijalankan
if (!BITESHP_API_KEY) {
    console.error('FATAL ERROR: Environment variable BITESHP_API_KEY tidak diatur. Harap atur di panel hosting Anda.');
}


// Kode pos asal pengiriman, diambil dari data perusahaan (Bandung 40122)
const ORIGIN_POSTAL_CODE = '40122';

// Endpoint untuk menghitung ongkos kirim via Biteship
app.post('/api/shipping-cost', async (req, res) => {
    // TERIMA: Menerima data baru dari frontend
    const { destinationPostalCode, destinationAreaName, weight } = req.body;

    // VALIDASI: Memastikan semua data yang diperlukan ada
    if (!destinationPostalCode || !destinationAreaName || !weight) {
        return res.status(400).json({ success: false, error: 'destinationPostalCode, destinationAreaName, dan weight diperlukan.' });
    }
    
    if (!BITESHP_API_KEY) {
        return res.status(500).json({ success: false, error: 'Kunci API Biteship tidak terkonfigurasi di server.' });
    }

    try {
        // FIX: Corrected typo from BITESHIP_BASE_URL to BITESHP_BASE_URL
        const response = await fetch(`${BITESHP_BASE_URL}/v1/rates/couriers`, {
            method: 'POST',
            headers: {
                // FIX: Corrected typo from 'BITESHIP_API_KEY' to 'BITESHP_API_KEY'.
                'Authorization': BITESHP_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                origin_postal_code: ORIGIN_POSTAL_CODE,
                destination_postal_code: destinationPostalCode,
                // FIX: Menggunakan 'destination_city' sesuai pesan error API.
                destination_city: destinationAreaName,
                couriers: 'jne,jnt,sicepat,anteraja',
                // GUNAKAN: Menggunakan `weight` (dalam kg) sebagai ganti `items`
                // Konversi dari gram ke kg, bulatkan ke atas, dan pastikan minimal 1kg
                weight: Math.max(1, Math.ceil(weight / 1000)),
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            console.error('Biteship API Error (rates):', data);
            throw new Error(data.error || data.message || 'Gagal mengambil data ongkos kirim dari Biteship.');
        }

        res.json(data);

    } catch (error) {
        console.error('Proxy Server Error (shipping-cost):', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint untuk melacak paket via Biteship
app.post('/api/track-package', async (req, res) => {
    const { trackingNumber, courier } = req.body;

    if (!trackingNumber || !courier) {
        return res.status(400).json({ success: false, error: 'trackingNumber dan courier diperlukan.' });
    }
    
    if (!BITESHP_API_KEY) {
        return res.status(500).json({ success: false, error: 'Kunci API Biteship tidak terkonfigurasi di server.' });
    }

    try {
        // FIX: Corrected typo from BITESHIP_BASE_URL to BITESHP_BASE_URL
        const response = await fetch(`${BITESHP_BASE_URL}/v1/trackings/${trackingNumber}/couriers/${courier}`, {
            method: 'GET',
            headers: {
                // FIX: Corrected typo from 'BITESHIP_API_KEY' to 'BITESHP_API_KEY'.
                'Authorization': BITESHP_API_KEY,
            },
        });
        
        const data = await response.json();
        if (!response.ok) {
             console.error('Biteship API Error (tracking):', data);
            throw new Error(data.message || 'Gagal melacak paket dari Biteship.');
        }

        res.json(data);

    } catch (error) {
        console.error('Proxy Server Error (track-package):', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(port, () => {
    console.log(`================================================`);
    console.log(`  🚀 Server Proxy API Biteship berjalan di http://localhost:${port}`);
    console.log(`================================================`);
    console.log(`  Server ini siap untuk meneruskan permintaan ke API Biteship.`);
});
