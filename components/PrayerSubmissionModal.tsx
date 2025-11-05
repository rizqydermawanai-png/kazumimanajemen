// components/PrayerSubmissionModal.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, Send, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { useToast } from '../hooks/useToast';
import { CustomSelect } from './ui/CustomSelect';
import type { PrayerName } from '../types';

interface PrayerSubmissionModalProps {
    onClose: () => void;
    onSubmit: (prayerName: PrayerName, photoProof: string) => void;
}

export const PrayerSubmissionModal = ({ onClose, onSubmit }: PrayerSubmissionModalProps) => {
    const [prayerName, setPrayerName] = useState<PrayerName>('Dzuhur');
    const [photoProof, setPhotoProof] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { addToast } = useToast();

    const startCamera = useCallback(async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setIsCameraReady(true);
                }
            } catch (err) {
                console.error("Error accessing camera: ", err);
                addToast({ title: 'Kamera Error', message: 'Gagal mengakses kamera. Pastikan Anda telah memberikan izin.', type: 'error' });
                onClose();
            }
        }
    }, [addToast, onClose]);

    const stopCamera = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setIsCameraReady(false);
        }
    }, []);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, [startCamera, stopCamera]);

    const handleTakePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                // Flip the image horizontally for a mirror effect
                context.translate(canvas.width, 0);
                context.scale(-1, 1);
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setPhotoProof(dataUrl);
                stopCamera();
            }
        }
    };

    const handleSubmit = () => {
        if (!photoProof) {
            addToast({ title: 'Error', message: 'Harap ambil foto bukti terlebih dahulu.', type: 'warning' });
            return;
        }
        setIsLoading(true);
        setTimeout(() => {
            onSubmit(prayerName, photoProof);
            setIsLoading(false);
        }, 500);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold text-slate-800 mb-4">Lapor Sholat</h2>
                <div className="space-y-4">
                    <CustomSelect label="Pilih Waktu Sholat" value={prayerName} onChange={e => setPrayerName(e.target.value as PrayerName)}>
                        <option>Dzuhur</option>
                        <option>Ashar</option>
                        <option>Maghrib</option>
                        <option>Isya</option>
                        <option>Subuh</option>
                    </CustomSelect>

                    <div className="flex flex-col items-center">
                        <p className="text-sm text-center text-slate-600 mb-2">Ambil foto yang menunjukkan Anda sedang sholat berjamaah.</p>
                        <div className="w-full h-64 bg-slate-200 rounded-lg overflow-hidden relative flex items-center justify-center">
                            {photoProof ? (
                                <img src={photoProof} alt="Bukti Foto" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]"></video>
                                    {!isCameraReady && <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white"><Loader2 className="animate-spin mb-2"/> Memulai kamera...</div>}
                                </>
                            )}
                        </div>
                        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                        {photoProof ? (
                            <Button variant="outline" onClick={() => { setPhotoProof(''); startCamera(); }} className="mt-4">Ambil Ulang Foto</Button>
                        ) : (
                            <Button onClick={handleTakePhoto} disabled={!isCameraReady} className="mt-4"><Camera className="mr-2"/> Ambil Foto Jamaah</Button>
                        )}
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="secondary" onClick={onClose}>Batal</Button>
                        <Button onClick={handleSubmit} disabled={isLoading || !photoProof}>
                            {isLoading ? <Loader2 className="animate-spin"/> : <Send size={16} className="mr-2" />}
                            Kirim Laporan
                        </Button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};