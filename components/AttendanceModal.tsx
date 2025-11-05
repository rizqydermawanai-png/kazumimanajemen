// components/AttendanceModal.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, FileText, Send, Loader2, Video, VideoOff } from 'lucide-react';
import { Button } from './ui/Button';
import { useToast } from '../hooks/useToast';
import type { AttendanceStatus } from '../types';

interface AttendanceModalProps {
    onSubmit: (status: AttendanceStatus, proof: string) => void;
    fullName: string;
}

export const AttendanceModal = ({ onSubmit, fullName }: AttendanceModalProps) => {
    const [status, setStatus] = useState<AttendanceStatus>('Hadir');
    const [proof, setProof] = useState<string>('');
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
                addToast({ title: 'Kamera Error', message: 'Tidak dapat mengakses kamera. Pastikan Anda telah memberikan izin.', type: 'error' });
                setStatus('Sakit'); // Fallback to another option if camera fails
            }
        }
    }, [addToast]);

    const stopCamera = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setIsCameraReady(false);
        }
    }, []);

    useEffect(() => {
        if (status === 'Hadir') {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [status, startCamera, stopCamera]);

    const handleTakePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setProof(dataUrl);
                stopCamera(); // Turn off camera after taking photo
            }
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                addToast({ title: 'File Terlalu Besar', message: 'Ukuran file tidak boleh melebihi 2MB.', type: 'error' });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setProof(reader.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = () => {
        setIsLoading(true);
        setTimeout(() => {
            onSubmit(status, proof);
            setIsLoading(false);
        }, 500);
    };

    const isSubmitDisabled = () => {
        if (isLoading) return true;
        if (status === 'Hadir' && !proof) return true;
        if (status === 'Sakit' && !proof) return true;
        if (status === 'Izin' && !proof.trim()) return true;
        return false;
    };
    
    const renderContent = () => {
        switch(status) {
            case 'Hadir':
                return (
                    <div className="flex flex-col items-center">
                        <div className="w-full max-w-sm h-64 bg-slate-200 rounded-lg overflow-hidden relative flex items-center justify-center">
                            {proof ? (
                                <img src={proof} alt="Selfie Preview" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                                    {!isCameraReady && <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white"><Loader2 className="animate-spin mb-2"/> Memulai kamera...</div>}
                                </>
                            )}
                        </div>
                        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                        {proof ? (
                            <Button variant="outline" onClick={() => { setProof(''); startCamera(); }} className="mt-4">Ambil Ulang Foto</Button>
                        ) : (
                            <Button onClick={handleTakePhoto} disabled={!isCameraReady} className="mt-4"><Camera className="mr-2"/> Ambil Foto</Button>
                        )}
                    </div>
                );
            case 'Sakit':
                return (
                     <div className="flex flex-col items-center">
                        <label htmlFor="proof-upload" className="w-full max-w-sm h-64 bg-slate-100 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors">
                            {proof ? (
                                <img src={proof} alt="Proof Preview" className="w-full h-full object-contain p-2" />
                            ) : (
                                <>
                                    <Upload size={40} className="text-slate-400 mb-2"/>
                                    <span className="text-slate-600 font-semibold">Unggah Bukti Sakit</span>
                                    <span className="text-xs text-slate-500">Maks. 2MB (JPG, PNG)</span>
                                </>
                            )}
                        </label>
                        <input id="proof-upload" type="file" accept="image/jpeg, image/png" className="hidden" onChange={handleFileUpload} />
                    </div>
                );
            case 'Izin':
                return (
                    <textarea 
                        value={proof}
                        onChange={(e) => setProof(e.target.value)}
                        rows={6}
                        className="w-full p-3 bg-slate-100 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Tuliskan alasan izin Anda di sini..."
                    />
                );
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-100 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-800">Absensi Harian</h1>
                    <p className="text-slate-500 mt-1">Selamat pagi, {fullName}. Silakan catat kehadiran Anda untuk hari ini.</p>
                </div>

                <div className="my-6">
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        {(['Hadir', 'Sakit', 'Izin'] as AttendanceStatus[]).map(s => (
                            <button
                                key={s}
                                onClick={() => { setStatus(s); setProof(''); }}
                                className={`flex-1 p-2 text-sm font-semibold rounded-md transition-colors ${status === s ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="min-h-[300px] flex items-center justify-center">
                    {renderContent()}
                </div>

                <Button onClick={handleSubmit} disabled={isSubmitDisabled()} className="w-full !mt-6">
                    {isLoading ? <Loader2 className="animate-spin"/> : <Send size={16} className="mr-2" />}
                    Kirim Absensi
                </Button>
            </motion.div>
        </div>
    );
};