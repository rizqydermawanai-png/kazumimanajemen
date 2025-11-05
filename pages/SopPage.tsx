// pages/SopPage.tsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { 
    AlertTriangle, CheckCircle, Package, ShoppingCart, Users, BookOpen, 
    Calculator, Box, CheckSquare, Truck, ClipboardList, Send, ScanLine 
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const SopSection = ({ children }: React.PropsWithChildren<{}>) => (
    <motion.div
        variants={{
            hidden: { opacity: 0 },
            visible: {
                opacity: 1,
                transition: {
                    staggerChildren: 0.1,
                },
            },
        }}
        initial="hidden"
        animate="visible"
        className="space-y-4"
    >
        {children}
    </motion.div>
);

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
};

const StepCard = ({ step, title, icon, children }: React.PropsWithChildren<{ step: number; title: string; icon: React.ReactNode }>) => (
    <motion.div variants={itemVariants} className="bg-white p-4 rounded-xl shadow-md border border-slate-200/80 flex gap-4">
        <div className="flex flex-col items-center">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                {step}
            </div>
            <div className="flex-grow w-0.5 bg-slate-200 my-2"></div>
        </div>
        <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center mb-2">
                {icon}
                <span className="ml-2">{title}</span>
            </h3>
            <div className="prose prose-sm max-w-none text-slate-600">
                {children}
            </div>
        </div>
    </motion.div>
);

const DoDontList = ({ dos, donts }: { dos: string[], donts: string[] }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="bg-green-50/50 p-3 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-700 flex items-center"><CheckCircle size={16} className="mr-2"/> Lakukan</h4>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-green-800">
                {dos.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        </div>
        <div className="bg-red-50/50 p-3 rounded-lg border border-red-200">
            <h4 className="font-semibold text-red-700 flex items-center"><AlertTriangle size={16} className="mr-2"/> Jangan Lakukan</h4>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-red-800">
                {donts.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        </div>
    </div>
);

// --- SOP Content Components ---

const GeneralSop = () => (
    <SopSection>
        <StepCard step={1} title="Prinsip & Etika Umum" icon={<Users size={20} className="text-indigo-600"/>}>
            <p>Setiap pegawai diharapkan menjunjung tinggi nilai-nilai inti perusahaan dalam setiap aktivitas kerja untuk menjaga lingkungan kerja yang positif dan produktif.</p>
            <ol>
                <li><strong>Profesionalisme:</strong> Bekerja dengan kompeten, bertanggung jawab, dan menjaga citra baik perusahaan. Datang tepat waktu dan selesaikan pekerjaan sesuai target.</li>
                <li><strong>Integritas:</strong> Bersikap jujur, transparan, dan menghindari konflik kepentingan. Laporkan setiap ketidaksesuaian atau masalah kepada atasan.</li>
                <li><strong>Kerja Sama Tim:</strong> Saling mendukung, menghormati, dan berkomunikasi secara efektif dengan rekan kerja lintas departemen.</li>
                <li><strong>Fokus pada Kualitas:</strong> Berkomitmen untuk menghasilkan produk dan layanan dengan standar tertinggi. Lakukan pengecekan ganda pada hasil kerja Anda.</li>
                <li><strong>Keamanan & Keselamatan:</strong> Memprioritaskan lingkungan kerja yang aman dan mematuhi semua protokol K3. Gunakan peralatan sesuai fungsinya.</li>
            </ol>
        </StepCard>
    </SopSection>
);

const ProduksiSop = () => (
    <SopSection>
        <StepCard step={1} title="Tinjau Permintaan Produksi" icon={<ClipboardList size={20} className="text-blue-600"/>}>
            <p>Alur kerja dimulai ketika ada permintaan produksi dari gudang.</p>
            <ol>
                <li>Buka halaman <strong>"Manajemen Produksi"</strong>.</li>
                <li>Klik tab <strong>"Permintaan Gudang"</strong>.</li>
                <li>Di bagian "Permintaan Baru", tinjau detail permintaan yang masuk (produk, jumlah, catatan).</li>
                <li>Klik tombol <strong>"Setujui & Proses"</strong>. Permintaan akan pindah ke bagian "Sedang Dikerjakan".</li>
            </ol>
        </StepCard>
        <StepCard step={2} title="Siapkan dan Hitung Kebutuhan" icon={<Calculator size={20} className="text-blue-600"/>}>
            <p>Setelah disetujui, siapkan kalkulasi untuk memulai produksi.</p>
            <ol>
                <li>Di bagian "Sedang Dikerjakan", temukan permintaan yang relevan dan klik <strong>"Selesaikan Produksi"</strong>.</li>
                <li>Sistem akan secara otomatis mengarahkan Anda ke tab <strong>"Kalkulator HPP"</strong> dan mengisi form produksi sesuai detail dari permintaan tersebut.</li>
                <li><strong>Verifikasi semua detail:</strong> jenis pakaian, model, ukuran, jumlah, dan warna. Pastikan harga bahan baku sudah sesuai dengan harga terbaru.</li>
                <li>Klik tombol <strong>"Hitung HPP"</strong> untuk melihat rincian biaya dan kebutuhan bahan.</li>
            </ol>
        </StepCard>
         <StepCard step={3} title="Konfirmasi Produksi & Buat Laporan" icon={<CheckSquare size={20} className="text-blue-600"/>}>
            <p>Langkah terakhir adalah mengonfirmasi produksi, yang akan mengurangi stok bahan baku dan membuat laporan.</p>
            <ol>
                <li>Setelah hasil kalkulasi muncul dan sudah benar, klik tombol <strong>"Simpan Laporan Produksi"</strong>.</li>
                <li>Tindakan ini akan secara otomatis:
                    <ul>
                        <li>Membuat laporan produksi yang tercatat di sistem.</li>
                        <li>Mengurangi stok bahan baku yang dibutuhkan dari gudang.</li>
                        <li>Mengubah status permintaan produksi menjadi "Selesai Produksi".</li>
                    </ul>
                </li>
                <li>Lanjutkan proses produksi fisik (potong, jahit, QC). Setelah selesai, serahkan barang jadi ke Departemen Gudang.</li>
            </ol>
        </StepCard>
        <Card>
            <DoDontList
                dos={[
                    "Selalu periksa kembali detail permintaan sebelum menyetujui.",
                    "Gunakan alat pelindung diri (APD) yang sesuai selama proses produksi.",
                    "Jaga kebersihan area kerja setiap saat.",
                    "Laporkan segera jika ada kerusakan mesin atau alat."
                ]}
                donts={[
                    "Menggunakan bahan baku yang tidak sesuai standar.",
                    "Melanjutkan produksi jika ditemukan cacat tanpa konfirmasi.",
                    "Mengubah standar ukuran tanpa persetujuan.",
                    "Meninggalkan area kerja dalam keadaan kotor."
                ]}
            />
        </Card>
    </SopSection>
);

const GudangSop = () => (
    <SopSection>
        <StepCard step={1} title="Manajemen Barang Masuk" icon={<Box size={20} className="text-teal-600"/>}>
            <p>Barang jadi yang selesai diproduksi harus diterima dan dimasukkan ke dalam stok sistem.</p>
            <ol>
                <li>Buka halaman <strong>"Manajemen Gudang"</strong>.</li>
                <li>Masuk ke tab <strong>"Barang Jadi"</strong>.</li>
                <li>Di bagian "Barang Masuk dari Produksi", akan ada daftar laporan produksi yang siap diterima.</li>
                <li>Hitung jumlah fisik barang, pastikan sesuai dengan laporan.</li>
                <li>Klik tombol <strong>"Terima Barang"</strong>. Stok barang jadi di sistem akan otomatis bertambah.</li>
            </ol>
        </StepCard>
        <StepCard step={2} title="Membuat Permintaan Produksi" icon={<Send size={20} className="text-teal-600"/>}>
            <p>Jika stok menipis, buat permintaan ke tim produksi.</p>
            <ol>
                <li>Buka tab <strong>"Permintaan Produksi"</strong>.</li>
                <li>Sistem akan memberikan "Rekomendasi Restock" untuk produk yang stoknya habis atau menipis. Klik <strong>"Tambah"</strong> untuk memasukkannya ke form.</li>
                <li>Atau, klik <strong>"Buat Permintaan Manual"</strong> untuk membuat permintaan dari nol.</li>
                <li>Isi form dengan produk dan jumlah yang dibutuhkan, lalu klik <strong>"Kirim Permintaan"</strong>.</li>
            </ol>
        </StepCard>
        <StepCard step={3} title="Proses Pesanan Online" icon={<Truck size={20} className="text-teal-600"/>}>
            <p>Alur kerja baru untuk memproses pesanan dari pelanggan secara kolaboratif.</p>
            <ol>
                <li>Buka tab <strong>"Pesanan Online"</strong>. (Kepala Gudang) Di bagian "Verifikasi Pembayaran", cek bukti transfer pelanggan. Jika valid, klik <strong>"Konfirmasi Pembayaran"</strong>.</li>
                <li>Pesanan akan otomatis pindah ke bagian "Pesanan Aktif" dengan status <strong>"Menunggu Dikerjakan"</strong>.</li>
                <li>Semua staf gudang dapat melihat pesanan ini. Siapa pun yang siap mengerjakan, klik tombol <strong>"Kerjakan Pesanan"</strong>.</li>
                <li>Secara otomatis, pesanan akan <strong>ditugaskan kepada Anda</strong> dan statusnya berubah menjadi "Sedang Disiapkan".</li>
                <li>Siapkan barang sesuai pesanan (picking & packing).</li>
                <li>Setelah paket diserahkan ke kurir dan mendapatkan nomor resi, masukkan nomor resi ke dalam input yang tersedia, lalu klik <strong>"Kirim"</strong>. Stok akan otomatis berkurang.</li>
            </ol>
        </StepCard>
        <Card>
             <DoDontList
                dos={[
                    "Lakukan pengecekan ganda saat menerima dan mengeluarkan barang.",
                    "Terapkan prinsip First-In, First-Out (FIFO) untuk perputaran stok.",
                    "Segera ambil pekerjaan dari antrian pesanan aktif.",
                    "Update status pesanan online secara real-time di sistem."
                ]}
                donts={[
                    "Mengeluarkan barang tanpa pencatatan di sistem.",
                    "Menunda konfirmasi penerimaan barang dari produksi.",
                    "Membiarkan pesanan menumpuk tanpa dikerjakan.",
                    "Memberikan nomor resi yang salah kepada pelanggan."
                ]}
            />
        </Card>
    </SopSection>
);

const PenjualanSop = () => (
    <SopSection>
        <StepCard step={1} title="Memulai Transaksi" icon={<ScanLine size={20} className="text-green-600"/>}>
            <p>Setiap transaksi penjualan offline harus dicatat melalui sistem Point of Sale (POS).</p>
            <ol>
                <li>Buka halaman <strong>"Point of Sale (POS)"</strong>.</li>
                <li>Sambut pelanggan dan tanyakan produk yang dicari.</li>
                <li>Klik tombol <strong>"Pilih Produk"</strong> untuk membuka daftar produk yang tersedia.</li>
                <li>Pilih produk yang diinginkan pelanggan dan klik <strong>"Tambah"</strong>. Produk akan masuk ke keranjang belanja.</li>
            </ol>
        </StepCard>
        <StepCard step={2} title="Mengelola Keranjang & Diskon" icon={<ShoppingCart size={20} className="text-green-600"/>}>
            <p>Atur jumlah produk, terapkan diskon, dan masukkan data pelanggan.</p>
            <ol>
                <li>Di keranjang belanja, sesuaikan jumlah (quantity) setiap item jika diperlukan.</li>
                <li>Isi <strong>"Nama Pelanggan"</strong> di kolom yang tersedia.</li>
                <li>Jika ada diskon manual, masukkan dalam bentuk persentase di kolom <strong>"Diskon Manual (%)"</strong>.</li>
                <li>Jika pelanggan memiliki kode promo, klik <strong>"Pilih Kode Promo"</strong> dan pilih kode yang sesuai.</li>
            </ol>
        </StepCard>
        <StepCard step={3} title="Menyelesaikan Pembayaran" icon={<CheckCircle size={20} className="text-green-600"/>}>
            <p>Proses akhir dari transaksi penjualan.</p>
            <ol>
                <li>Periksa kembali ringkasan pesanan di sisi kanan, pastikan totalnya sudah benar.</li>
                <li>Setelah menerima pembayaran dari pelanggan (tunai/transfer), klik tombol <strong>"Buat Transaksi"</strong>.</li>
                <li>Transaksi akan tercatat, stok produk otomatis berkurang, dan keranjang akan kosong, siap untuk transaksi berikutnya.</li>
                <li>Tawarkan kepada pelanggan apakah ingin struk dicetak.</li>
            </ol>
        </StepCard>
         <Card>
            <DoDontList
                dos={[
                    "Selalu bersikap ramah dan solutif kepada pelanggan.",
                    "Pastikan harga di sistem sesuai dengan label harga.",
                    "Tawarkan produk tambahan yang relevan (upselling/cross-selling).",
                    "Jaga kebersihan dan kerapian area display produk."
                ]}
                donts={[
                    "Melakukan transaksi di luar sistem (manual).",
                    "Memberikan diskon manual tanpa persetujuan atasan.",
                    "Mengabaikan keluhan atau pertanyaan pelanggan.",
                    "Berdebat dengan pelanggan terkait harga atau kebijakan."
                ]}
            />
        </Card>
    </SopSection>
);


export const SopPage = () => {
    const { state } = useAppContext();
    const { currentUser } = state;

    if (!currentUser) return null;

    const isAdmin = currentUser.role === 'super_admin' || currentUser.role === 'admin';
    
    const visibleTabs = useMemo(() => {
        const baseTabs = ['general'];
        const allDeptTabs = ['produksi', 'gudang', 'penjualan'];
        
        if (isAdmin) {
            return [...baseTabs, ...allDeptTabs];
        }
        
        if (currentUser.department && allDeptTabs.includes(currentUser.department)) {
            return [...baseTabs, currentUser.department];
        }

        return baseTabs;
    }, [currentUser, isAdmin]);

    const [activeTab, setActiveTab] = useState<string>(visibleTabs[0]);

    const tabNames: { [key: string]: { name: string, icon: React.ElementType } } = {
        general: { name: 'Prinsip Umum', icon: Users },
        produksi: { name: 'Dept. Produksi', icon: ShoppingCart },
        gudang: { name: 'Dept. Gudang', icon: Package },
        penjualan: { name: 'Dept. Penjualan', icon: ScanLine },
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'produksi': return <ProduksiSop />;
            case 'gudang': return <GudangSop />;
            case 'penjualan': return <PenjualanSop />;
            case 'general':
            default: return <GeneralSop />;
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3"><BookOpen /> Pedoman SOP</h1>
            <p className="text-slate-600">Panduan, aturan, dan prosedur standar yang wajib diikuti untuk menjaga kualitas, efisiensi, dan profesionalisme kerja.</p>
            
            <div className="bg-white p-2 rounded-xl shadow-md flex gap-2 flex-wrap sticky top-2 z-10">
                {visibleTabs.map(tab => {
                    const { name, icon: Icon } = tabNames[tab];
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 p-3 font-semibold text-center transition-colors duration-300 relative flex items-center justify-center gap-2 rounded-lg ${
                                activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-indigo-100'
                            }`}
                        >
                            <Icon size={18} />
                            <span>{name}</span>
                        </button>
                    );
                })}
            </div>
            
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                >
                    {renderContent()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};