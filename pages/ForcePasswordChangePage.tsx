// pages/ForcePasswordChangePage.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { CustomInput } from '../components/ui/CustomInput';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../hooks/useToast';

export const ForcePasswordChangePage = () => {
    const { state, dispatch } = useAppContext();
    const { currentUser } = state;
    const { addToast } = useToast();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('Password baru harus minimal 6 karakter.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Password baru dan konfirmasi tidak cocok.');
            return;
        }
        
        if (newPassword === '123456') {
             setError('Anda harus menggunakan password yang berbeda dari password sementara.');
            return;
        }

        setIsLoading(true);
        setTimeout(() => {
            if (currentUser) {
                dispatch({
                    type: 'UPDATE_CURRENT_USER',
                    payload: (prevUser) => prevUser ? {
                        ...prevUser,
                        password: newPassword,
                        forcePasswordChange: false,
                    } : null
                });
                addToast({ title: 'Password Diperbarui', message: 'Anda sekarang dapat mengakses dasbor.', type: 'success' });
            }
            setIsLoading(false);
        }, 500);
    };

    return (
        <div className="flex h-screen bg-slate-100 items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl"
            >
                <KeyRound size={48} className="mx-auto text-indigo-500 mb-4" />
                <h1 className="text-2xl font-bold text-slate-800 text-center">Ganti Password Anda</h1>
                <p className="text-slate-600 text-center mt-2 mb-6">
                    Untuk keamanan, Anda harus mengganti password sementara Anda sebelum melanjutkan.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <CustomInput
                            label="Password Baru"
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                         <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-slate-500 hover:text-slate-700 transition-colors">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                    </div>
                     <div className="relative">
                        <CustomInput
                            label="Konfirmasi Password Baru"
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <Button type="submit" className="w-full !mt-6" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : <CheckCircle size={16} />}
                        {isLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
                    </Button>
                </form>
            </motion.div>
        </div>
    );
};