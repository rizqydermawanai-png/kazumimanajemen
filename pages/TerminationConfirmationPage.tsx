// pages/TerminationConfirmationPage.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { getUsernameById, formatDate } from '../lib/utils';
import { useToast } from '../hooks/useToast';
import { AlertTriangle, LogOut, Info } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface TerminationConfirmationPageProps {
    onConfirmAndProceedToLogout: () => void;
}

export const TerminationConfirmationPage = ({ onConfirmAndProceedToLogout }: TerminationConfirmationPageProps) => {
    const { state, dispatch } = useAppContext();
    const { currentUser, messages, users } = state;
    const { addToast } = useToast();

    if (!currentUser) return null;

    const terminationMessageToDisplay = messages.find(
        msg => msg.recipientId === currentUser.uid && msg.action?.type === 'CONFIRM_TERMINATION' && !msg.actionCompleted
    );

    const handleLogout = () => {
        dispatch({ type: 'LOGOUT' });
        addToast({ title: 'Logout', message: 'Anda telah berhasil keluar.', type: 'info' });
    };

    const handleConfirmAction = () => {
        if (!terminationMessageToDisplay) {
            addToast({ title: 'Error', message: 'Pesan konfirmasi tidak ditemukan.', type: 'error' });
            return;
        }

        const updatedUsers = users.map(u =>
            u.uid === currentUser.uid
                ? { ...u, isApproved: false, status: 'terminated' as const }
                : u
        );
        dispatch({ type: 'SET_USERS', payload: updatedUsers });

        const updatedMessages = messages.map(msg =>
            msg.id === terminationMessageToDisplay.id
                ? { ...msg, actionCompleted: true }
                : msg
        );
        dispatch({ type: 'SET_MESSAGES', payload: updatedMessages });

        dispatch({ type: 'ADD_ACTIVITY', payload: { type: 'Manajemen Akun', description: `Pengguna ${currentUser.fullName} mengonfirmasi pemecatan dan akunnya dinonaktifkan.`, relatedId: currentUser.uid } });

        addToast({ title: 'Konfirmasi Berhasil', message: 'Akun Anda akan dinonaktifkan.', type: 'success' });
        
        onConfirmAndProceedToLogout();
    };
    
    if (!terminationMessageToDisplay) {
        return (
            <div className="flex h-screen bg-slate-100 items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md text-center bg-white p-8 rounded-2xl shadow-2xl"
                >
                    <Info size={40} className="mx-auto text-blue-500 mb-4" />
                    <h1 className="text-2xl font-bold text-slate-800">Tidak Ada Tindakan Diperlukan</h1>
                    <p className="text-slate-600 mt-2">Tidak ada pemberitahuan yang memerlukan tindakan Anda saat ini.</p>
                    <Button onClick={handleLogout} className="mt-6">
                        <LogOut size={16} className="mr-2" /> Logout
                    </Button>
                </motion.div>
            </div>
        );
    }
    
    return (
        <div className="flex h-screen bg-slate-100 items-center justify-center p-4">
            <motion.div
                layout
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border relative"
            >
                <button
                    onClick={handleLogout}
                    className="absolute top-4 right-4 p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors z-10"
                    aria-label="Logout"
                >
                    <LogOut size={22} />
                </button>
                <motion.div
                    key="notice"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                    <div className="p-6 text-center border-b">
                        <h1 className="text-4xl font-extrabold text-indigo-600 tracking-wider">KAZUMI</h1>
                    </div>
                    <header className="p-6 bg-orange-50 border-b border-orange-200 flex items-center gap-4">
                        <AlertTriangle className="text-orange-500 flex-shrink-0" size={32} />
                        <div>
                            <h2 className="text-xl font-bold text-orange-800">Pemberitahuan Pemutusan Hubungan Kerja</h2>
                            <p className="text-sm text-orange-700">Harap baca informasi berikut dengan saksama.</p>
                        </div>
                    </header>
                    <main className="p-6 space-y-4 max-h-[40vh] overflow-y-auto">
                        <div className="flex items-center text-sm bg-slate-50 p-3 rounded-lg">
                            <img 
                                src={users.find(u => u.uid === terminationMessageToDisplay.authorId)?.profilePictureUrl || `https://api.dicebear.com/8.x/initials/svg?seed=System`} 
                                alt="author" 
                                className="w-10 h-10 rounded-full mr-4"
                            />
                            <div>
                                <p className="font-semibold text-slate-800">Dari: {getUsernameById(terminationMessageToDisplay.authorId, users)}</p>
                                <p className="text-xs text-slate-500">Tanggal: {formatDate(terminationMessageToDisplay.timestamp)}</p>
                            </div>
                        </div>
                        <div className="border-t pt-4">
                             <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{terminationMessageToDisplay.content}</p>
                        </div>
                    </main>
                    <footer className="p-6 bg-red-50/50 border-t border-red-200 flex flex-col items-center">
                        <p className="text-sm text-center text-red-800 mb-4 font-semibold">
                            Dengan menekan tombol di bawah, Anda mengonfirmasi bahwa Anda telah membaca dan memahami pemberitahuan ini. <strong>Tindakan ini bersifat final dan tidak dapat diurungkan.</strong>
                        </p>
                        <Button variant="danger" className="w-full max-w-sm" onClick={handleConfirmAction}>
                            Konfirmasi & Nonaktifkan Akun Saya
                        </Button>
                    </footer>
                </motion.div>
            </motion.div>
        </div>
    );
};
