import * as functions from "firebase-functions";
import * as express from "express";
import * as cors from "cors";
import fetch from "node-fetch";

// Inisialisasi Express app
const app = express();

// Gunakan CORS untuk mengizinkan permintaan dari domain frontend Anda
app.use(cors({ origin: true }));
app.use(express.json());

// Ambil API Key dari environment variables Firebase Functions
// Pastikan untuk mengaturnya dengan `firebase functions:config:set biteship.key="YOUR_API_KEY"`
const BITESHP_API_KEY = functions.config().biteship?.key;
const BITESHP_BASE_URL = 'https://api.biteship.com';
const ORIGIN_POSTAL_CODE = '40122';

// Endpoint untuk menghitung ongkos kirim
app.post('/shipping-cost', async (req, res) => {
    const { destinationPostalCode, destinationAreaName, weight } = req.body;

    if (!destinationPostalCode || !destinationAreaName || !weight) {
        return res.status(400).json({ success: false, error: 'Data tidak lengkap.' });
    }
    
    if (!BITESHP_API_KEY) {
        console.error('FATAL ERROR: Biteship API key not configured.');
        return res.status(500).json({ success: false, error: 'Kunci API server tidak terkonfigurasi.' });
    }

    try {
        const response = await fetch(`${BITESHP_BASE_URL}/v1/rates/couriers`, {
            method: 'POST',
            headers: {
                'Authorization': BITESHP_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                origin_postal_code: ORIGIN_POSTAL_CODE,
                destination_postal_code: destinationPostalCode,
                destination_city: destinationAreaName,
                couriers: 'jne,jnt,sicepat,anteraja',
                weight: Math.max(1, Math.ceil(weight / 1000)),
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            console.error('Biteship API Error (rates):', data);
            throw new Error(data.error || data.message || 'Gagal mengambil data ongkos kirim.');
        }

        res.json(data);
    } catch (error: any) {
        console.error('Proxy Function Error (shipping-cost):', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint untuk melacak paket
app.post('/track-package', async (req, res) => {
    const { trackingNumber, courier } = req.body;

    if (!trackingNumber || !courier) {
        return res.status(400).json({ success: false, error: 'Nomor resi dan kurir diperlukan.' });
    }
    
    if (!BITESHP_API_KEY) {
        console.error('FATAL ERROR: Biteship API key not configured.');
        return res.status(500).json({ success: false, error: 'Kunci API server tidak terkonfigurasi.' });
    }

    try {
        const response = await fetch(`${BITESHP_BASE_URL}/v1/trackings/${trackingNumber}/couriers/${courier}`, {
            method: 'GET',
            headers: {
                'Authorization': BITESHP_API_KEY,
            },
        });
        
        const data = await response.json();
        if (!response.ok) {
             console.error('Biteship API Error (tracking):', data);
            throw new Error(data.message || 'Gagal melacak paket.');
        }

        res.json(data);

    } catch (error: any) {
        console.error('Proxy Function Error (track-package):', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Ekspor Express app sebagai Cloud Function bernama 'api' yang di-hosting di region asia-southeast2 (Jakarta)
export const api = functions.region('asia-southeast2').https.onRequest(app);
