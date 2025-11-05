# Panduan Hosting Kazumi ERP & E-commerce di Hostinger (dengan Transformasi Real-Time)

Dokumen ini adalah panduan lengkap untuk mengubah arsitektur aplikasi dari **client-side (menggunakan localStorage)** menjadi **full-stack dengan backend dan database**, serta mendeploy-nya secara online menggunakan layanan **Hostinger**.

Tujuan utamanya adalah agar aplikasi dapat berjalan di domain Anda sendiri dan memiliki **data yang tersinkronisasi secara real-time antar semua perangkat**.

---

## 1. Memahami Arsitektur: Dari `localStorage` ke Database Real-Time

### Arsitektur Saat Ini (Client-Side)

Aplikasi Anda saat ini berjalan sepenuhnya di browser pengguna. Seluruh data (pengguna, produk, penjualan, dll.) disimpan di `localStorage`.

-   **Kelebihan:** Sangat cepat, tidak butuh server, bisa berjalan offline.
-   **Kekurangan Fatal:** Data **TIDAK BISA** dibagi atau disinkronkan antar perangkat atau antar pengguna. Setiap pengguna memiliki datanya sendiri-sendiri di browser masing-masing.

### Arsitektur Baru yang Dibutuhkan (Full-Stack)

Untuk data real-time yang dapat diakses dari mana saja, kita perlu arsitektur client-server:

1.  **Frontend (React App):** Ini adalah aplikasi React yang sudah Anda miliki. Tugasnya hanya menampilkan data dan mengirim interaksi pengguna ke backend.
2.  **Backend (Server Node.js):** Sebuah server yang berjalan 24/7 di Hostinger. Tugasnya adalah menerima permintaan dari frontend, memproses logika bisnis (misalnya, menghitung HPP, membuat pesanan), dan berinteraksi dengan database.
3.  **Database (MySQL/MariaDB):** "Otak" penyimpanan data yang terpusat. Semua data aplikasi akan disimpan di sini, memungkinkan semua pengguna mengakses data yang sama secara real-time.



---

## 2. Langkah-langkah Hosting & Transformasi di Hostinger

### Prasyarat

-   Paket hosting di Hostinger yang mendukung **Node.js** (misalnya, paket **Business** atau lebih tinggi).
-   Akses ke **hPanel** Hostinger Anda.
-   Domain yang sudah terhubung dengan hosting Anda.

---

### Langkah 1: Menyiapkan Database di Hostinger

Database akan menyimpan semua data aplikasi Anda secara terpusat.

1.  **Masuk ke hPanel Hostinger.**
2.  Navigasi ke menu **"Database"** -> **"Manajemen"**.
3.  Buat database baru:
    -   **Nama Database:** `uXXXX_kazumi_db` (Hostinger akan memberikan prefix `uXXXX_`).
    -   **Username Database:** `uXXXX_kazumi_user`.
    -   **Buat Password yang Kuat** dan simpan baik-baik.
4.  Klik **"Buat"**.
5.  **Catat informasi berikut**, karena akan sangat penting untuk backend:
    -   **Host MySQL:** Biasanya `localhost` jika server dan database berada di hosting yang sama.
    -   **Nama Database:** (Contoh: `uXXXX_kazumi_db`)
    -   **User:** (Contoh: `uXXXX_kazumi_user`)
    -   **Password:** (Password yang baru saja Anda buat)

---

### Langkah 2: Menyiapkan dan Mengunggah Backend (Node.js)

Backend adalah jembatan antara frontend Anda dan database. File `server.mjs` yang ada di proyek adalah titik awal yang baik, tetapi perlu dimodifikasi untuk terhubung ke database.

**Modifikasi `server.mjs` (Gambaran Umum):**
Anda perlu menambahkan *library* seperti `mysql2` untuk terhubung ke database dan `socket.io` untuk komunikasi real-time. Anda juga perlu membuat API endpoints (misalnya, `GET /api/products`, `POST /api/sales`) yang akan mengambil atau menyimpan data ke database.

**Proses Deployment di Hostinger:**

1.  **Struktur Folder:** Di komputer Anda, buat struktur folder untuk deployment:
    ```
    /kazumi-deployment
        /backend         <-- Masukkan semua file backend di sini (server.mjs, package.json, dll.)
        /frontend_build  <-- Folder ini akan berisi hasil build dari React
    ```

2.  **Masuk ke hPanel** -> **"File"** -> **"File Manager"**.
3.  Navigasi ke `public_html` dan buat folder baru, misalnya `kazumi_app`.
4.  **Upload folder `backend`** ke dalam `kazumi_app`.

5.  **Konfigurasi Aplikasi Node.js di hPanel:**
    -   Navigasi ke **"Advanced"** -> **"Setup Node.js App"**.
    -   Klik **"Create Application"**.
    -   **Node.js version:** Pilih versi LTS terbaru (misalnya, 18.x).
    -   **Application mode:** `production`.
    -   **Application root:** Arahkan ke folder backend Anda (`kazumi_app/backend`).
    -   **Application startup file:** `server.mjs`.
    -   Klik **"Create"**.

6.  **Install Dependencies:** Setelah aplikasi dibuat, klik **"Enter Virtual Environment"**, lalu jalankan:
    ```bash
    npm install
    ```
    Ini akan menginstall `express`, `cors`, dll. yang ada di `package.json` Anda.

7.  **Set Environment Variables (SANGAT PENTING):**
    -   Di halaman "Setup Node.js App", temukan aplikasi Anda dan klik **"Edit"**.
    -   Scroll ke bawah ke bagian **"Environment variables"**.
    -   Tambahkan variabel untuk koneksi database dan API key:
        -   `DB_HOST`: `localhost`
        -   `DB_USER`: `uXXXX_kazumi_user`
        -   `DB_PASSWORD`: `PasswordDatabaseAnda`
        -   `DB_NAME`: `uXXXX_kazumi_db`
        -   `BITESHIP_API_KEY`: `KunciApiBiteshipAnda`
    -   Klik **"Update"**. Backend Anda sekarang siap berjalan.

---

### Langkah 3: Membangun dan Mengunggah Frontend (React)

Frontend perlu di-compile menjadi file statis (HTML, CSS, JS) yang efisien.

1.  **Install Vite:** Jika belum, install Vite sebagai *build tool*.
    ```bash
    npm install -D vite @vitejs/plugin-react
    ```
2.  **Konfigurasi Vite:** Buat file `vite.config.js` di root proyek Anda.
    ```javascript
    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';

    export default defineConfig({
      plugins: [react()],
      build: {
        outDir: 'build' // atau 'dist'
      }
    });
    ```
3.  **Build Aplikasi:** Jalankan perintah build di terminal Anda.
    ```bash
    npm run build
    ```
    Ini akan membuat folder baru bernama `build` (atau `dist`) yang berisi semua file statis frontend.

4.  **Upload ke Hostinger:**
    -   Kembali ke **File Manager**.
    -   Buat folder di `public_html` untuk domain utama Anda, atau gunakan folder domain yang sudah ada.
    -   **Upload seluruh isi dari folder `build`** (JANGAN folder `build`-nya itu sendiri) ke folder domain di `public_html`.

---

### Langkah 4: Menghubungkan Domain dan Menjalankan Aplikasi

1.  **Arahkan Domain:** Pastikan domain Anda di Hostinger sudah mengarah ke folder `public_html` tempat Anda mengunggah file frontend.
2.  **Jalankan Backend:** Kembali ke halaman "Setup Node.js App" di hPanel, temukan aplikasi Anda, dan klik **"Start"** atau **"Restart"**.
3.  **Akses Website:** Buka domain Anda di browser (misalnya, `www.namadomainanda.com`). Aplikasi React Anda sekarang akan dimuat.

Aplikasi frontend Anda sekarang akan membuat panggilan API ke backend Node.js, yang kemudian akan berinteraksi dengan database MySQL terpusat. Semua pengguna yang mengakses domain Anda akan melihat dan berinteraksi dengan data yang sama secara real-time.

---

## 3. Modifikasi Kode yang Diperlukan (Gambaran Umum)

Transformasi ini memerlukan perubahan signifikan pada kode React Anda. Anda perlu mengganti semua logika yang membaca/menulis ke `localStorage` dengan panggilan API ke backend Anda.

**Contoh Perubahan di `context/AppContext.tsx`:**

**Sebelumnya (dengan localStorage):**
```javascript
useEffect(() => {
    localStorage.setItem('kazumi_appState', JSON.stringify(state));
}, [state]);

// ... di dalam reducer
case 'ADD_PRODUCT':
    return { ...state, products: [...state.products, action.payload] };
```

**Sesudah (dengan Backend):**
```javascript
// Mengambil data awal saat aplikasi dimuat
useEffect(() => {
    async function fetchData() {
        const productsResponse = await fetch('/api/products');
        const products = await productsResponse.json();
        dispatch({ type: 'SET_PRODUCTS', payload: products });
    }
    fetchData();
}, []);

// ... di dalam reducer atau action handler
async function addProduct(product) {
    const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
    });
    const newProduct = await response.json();
    dispatch({ type: 'ADD_PRODUCT_SUCCESS', payload: newProduct });
}
```

Perubahan ini perlu diterapkan di seluruh aplikasi untuk semua jenis data (pengguna, penjualan, stok, dll.) untuk mencapai fungsionalitas online dan real-time sepenuhnya.