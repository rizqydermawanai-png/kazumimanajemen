# Panduan Deployment Aplikasi Kazumi ke Firebase

Dokumen ini berisi langkah-langkah lengkap untuk men-deploy aplikasi React Anda ke **Firebase Hosting**, dengan backend berjalan di **Cloud Functions** dan data disimpan di **Cloud Firestore**.

---

## 1. Persiapan Awal

Sebelum memulai, pastikan Anda sudah memiliki:
1.  **Akun Google** untuk mendaftar ke Firebase.
2.  **Node.js** terinstal di komputer Anda.
3.  **Firebase CLI** terinstal secara global. Jika belum, jalankan perintah ini di terminal:
    ```bash
    npm install -g firebase-tools
    ```

---

## 2. Setup Proyek Firebase

1.  **Buat Proyek Firebase:**
    -   Buka [Firebase Console](https://console.firebase.google.com/).
    -   Klik **"Add project"** dan ikuti instruksi untuk membuat proyek baru (misalnya, `kazumi-app`).

2.  **Aktifkan Layanan yang Dibutuhkan:**
    -   Di menu sebelah kiri, buka **Build > Authentication**. Klik **"Get started"** dan aktifkan metode **Email/Password**.
    -   Buka **Build > Firestore Database**. Klik **"Create database"**, mulai dalam **Production mode**, dan pilih lokasi server yang paling dekat dengan Anda (misalnya, `asia-southeast2` untuk Jakarta).

3.  **Dapatkan Konfigurasi Klien:**
    -   Di halaman utama proyek Anda, klik ikon `</>` untuk menambahkan aplikasi Web.
    -   Beri nama aplikasi (misal, `kazumi-web`) dan klik **"Register app"**.
    -   Firebase akan menampilkan `firebaseConfig`. **Copy objek konfigurasi ini.**

---

## 3. Konfigurasi Proyek Lokal

1.  **Isi `firebaseConfig.ts`:**
    -   Buka file `firebaseConfig.ts` di proyek Anda.
    -   **Paste** objek `firebaseConfig` yang Anda copy tadi untuk menggantikan placeholder yang ada.

2.  **Hubungkan Firebase CLI ke Proyek Anda:**
    -   Buka terminal di root direktori proyek Anda.
    -   Login ke akun Google Anda:
        ```bash
        firebase login
        ```
    -   Isi file `.firebaserc` dengan ID Proyek Firebase Anda (bukan nama proyek). Anda bisa menemukannya di **Project Settings > General > Project ID**.
        ```json
        {
          "projects": {
            "default": "kazumi-app-abcdef" // Ganti dengan Project ID Anda
          }
        }
        ```

3.  **Konfigurasi API Key Backend (Sangat Penting):**
    -   Jalankan perintah berikut di terminal untuk menyimpan API Key Biteship Anda secara aman di lingkungan Cloud Functions. Ganti `KUNCI_API_BITESHIP_ANDA` dengan kunci yang valid.
        ```bash
        firebase functions:config:set biteship.key="KUNCI_API_BITESHIP_ANDA"
        ```
    -   Ini akan memastikan backend Anda dapat mengakses API Biteship tanpa mengekspos kunci di dalam kode.

---

## 4. Proses Deployment

Sekarang semuanya siap untuk di-deploy.

1.  **Install Dependensi Backend:**
    -   Cloud Functions memiliki dependensinya sendiri. Masuk ke direktori `functions` dan install:
        ```bash
        cd functions
        npm install
        cd ..
        ```

2.  **Build Aplikasi Frontend:**
    -   Pastikan Anda kembali di direktori root proyek.
    -   Jalankan perintah build untuk meng-compile aplikasi React Anda menjadi file statis.
        ```bash
        npm run build
        ```
    -   Perintah ini akan membuat folder `build/` yang berisi semua file yang siap di-hosting.

3.  **Deploy ke Firebase:**
    -   Jalankan perintah deploy. Firebase CLI akan secara otomatis membaca `firebase.json` dan men-deploy semuanya (Hosting, Functions, dan Aturan Firestore).
        ```bash
        firebase deploy
        ```
    -   Proses ini mungkin memakan waktu beberapa menit, terutama saat pertama kali men-deploy Cloud Functions.

Setelah selesai, Firebase akan memberikan Anda **URL Hosting** (misalnya, `https://kazumi-app-abcdef.web.app`). Buka URL tersebut, dan aplikasi Anda kini sudah online!

---

## 5. Langkah Selanjutnya: Migrasi dari `localStorage` ke Firestore

Aplikasi Anda sekarang online, tetapi masih menggunakan `localStorage`. Untuk membuatnya menjadi aplikasi *full-stack* sejati, Anda perlu mengganti semua interaksi `localStorage` dengan panggilan ke Firestore.

Ini adalah perubahan besar yang perlu dilakukan secara bertahap. Berikut adalah panduannya:

1.  **Otentikasi:**
    -   Di `pages/AuthPage.tsx`, ganti logika login manual dengan **Firebase Authentication**.
    -   Gunakan `signInWithEmailAndPassword` untuk login dan `createUserWithEmailAndPassword` untuk registrasi.
    -   Setelah registrasi berhasil, buat dokumen baru di koleksi `users` di Firestore dengan `uid` dari pengguna yang baru dibuat.
    -   Gunakan `onAuthStateChanged` di `App.tsx` untuk memantau status login pengguna secara real-time.

2.  **Manajemen Data:**
    -   Hapus `getInitialState` dari `context/initialState.ts` yang membaca dari `localStorage`.
    -   Di `context/AppContext.tsx`, hapus `useEffect` yang menyimpan state ke `localStorage`.
    -   Sebagai gantinya, saat pengguna login, buat fungsi yang mengambil data awal dari berbagai koleksi di Firestore (misalnya, `products`, `sales`, `materials`) dan mengisi state aplikasi dengan data tersebut.
    -   Setiap kali ada aksi yang mengubah data (misalnya, membuat penjualan baru), ubah kodenya untuk:
        a. Menulis data baru ke Firestore (`addDoc` atau `setDoc`).
        b. **Setelah berhasil**, baru perbarui state React (`dispatch`).

**Contoh Perubahan (di dalam komponen, bukan reducer):**

```typescript
// pages/Sales.tsx

import { db } from '../firebaseConfig'; // Impor instance Firestore
import { collection, addDoc } from "firebase/firestore";

// ... di dalam fungsi handleCreateSale

const handleCreateSale = async () => {
    // ... validasi keranjang
    
    const newSale = { /* ... data penjualan ... */ };
    
    try {
        // 1. Tulis data ke Firestore
        const docRef = await addDoc(collection(db, "sales"), newSale);
        
        // 2. Setelah berhasil, perbarui state React
        // Asumsikan 'setSales' adalah fungsi dari context atau props
        setSales(prev => [{ ...newSale, id: docRef.id }, ...prev]);
        
        addToast({ title: 'Penjualan Berhasil', type: 'success' });
        
        // ... reset form
    } catch (e) {
        console.error("Error adding document: ", e);
        addToast({ title: 'Gagal Menyimpan', type: 'error' });
    }
};
```

Dengan mengikuti panduan ini, Anda dapat berhasil men-deploy dan mentransformasi aplikasi Anda menjadi aplikasi web full-stack yang andal di Firebase. Selamat mencoba!
