// pages/PrayerReportPage.tsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { formatDate } from '../lib/utils';
import type { PrayerRecord } from '../types';
import { CalendarCheck2, Clock, CheckCircle, Camera, PlusCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

// FIX: onOpenModal needs to be passed down or handled differently.
// For now, this component cannot open the modal by itself as the modal state lives in App.tsx
// Let's assume onOpenModal is passed from a parent that has access to it.
interface PrayerReportPageProps {
    onOpenModal: () => void;
}

const PrayerRecordCard: React.FC<{ record: PrayerRecord, onPhotoClick: (photo: string) => void }> = ({ record, onPhotoClick }) => {
    const isOntime = record.status === 'on_time';
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-4 rounded-xl shadow-md border flex items-center justify-between gap-4"
        >
            <div className="flex items-center gap-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${isOntime ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                    {isOntime ? <CheckCircle size={24} /> : <Clock size={24} />}
                </div>
                <div>
                    <p className="font-bold text-lg text-slate-800">Sholat {record.prayerName}</p>
                    <p className={`text-sm font-semibold ${isOntime ? 'text-green-700' : 'text-yellow-700'}`}>
                        {isOntime ? 'Tepat Waktu' : 'Terlambat'}
                    </p>
                    <p className="text-xs text-slate-500">
                        {formatDate(record.timestamp)}
                    </p>
                </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => onPhotoClick(record.photoProof)}>
                <Camera size={14} className="mr-2" /> Lihat Bukti
            </Button>
        </motion.div>
    );
};

export const PrayerReportPage = ({ onOpenModal }: PrayerReportPageProps) => {
    const { state } = useAppContext();
    const { currentUser, prayerRecords } = state;

    const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

    const myPrayerRecords = useMemo(() => {
        if (!currentUser) return [];
        return prayerRecords
            .filter(r => r.userId === currentUser.uid)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [prayerRecords, currentUser]);

    if (!currentUser) return null;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <CalendarCheck2 /> Laporan Sholat Saya
                </h1>
                <Button onClick={onOpenModal}>
                    <PlusCircle size={18} className="mr-2" /> Lapor Sholat
                </Button>
            </div>
            <p className="text-slate-600">Catat dan laporkan sholat wajib Anda untuk mendapatkan poin disiplin. Setiap laporan sholat tepat waktu akan menambah poin kinerja Anda.</p>

            <Card>
                <h2 className="text-xl font-bold text-slate-700 mb-4">Riwayat Laporan</h2>
                <div className="space-y-3">
                    <AnimatePresence>
                        {myPrayerRecords.length > 0 ? (
                            myPrayerRecords.map(record => (
                                <PrayerRecordCard key={record.id} record={record} onPhotoClick={setViewingPhoto} />
                            ))
                        ) : (
                            <div className="text-center p-12 text-slate-500">
                                <p className="font-semibold">Belum ada laporan</p>
                                <p>Klik "Lapor Sholat" untuk mencatat sholat yang telah Anda kerjakan.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </Card>

            {viewingPhoto && (
                <Modal isOpen={!!viewingPhoto} onClose={() => setViewingPhoto(null)} title="Bukti Foto Sholat">
                    <img src={viewingPhoto} alt="Bukti Foto" className="w-full h-auto rounded-lg" />
                    <div className="text-right mt-4">
                        <Button variant="secondary" onClick={() => setViewingPhoto(null)}>Tutup</Button>
                    </div>
                </Modal>
            )}
        </div>
    );
};
