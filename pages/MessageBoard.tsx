// pages/MessageBoard.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { getUsernameById, formatDate } from '../lib/utils';
import { useToast } from '../hooks/useToast';
import { useAppContext } from '../context/AppContext';
import type { Message } from '../types';

export const MessageBoardPage = () => {
    const { state, dispatch } = useAppContext();
    const { messages, currentUser, users } = state;

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const { addToast } = useToast();
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

    const handlePostMessage = () => {
        if (!currentUser || !title.trim() || !content.trim()) {
            addToast({ title: 'Error', message: 'Judul dan isi pesan tidak boleh kosong.', type: 'error'});
            return;
        };
        const newMessage: Message = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            authorId: currentUser.uid,
            title,
            content,
        };
        dispatch({ type: 'SET_MESSAGES', payload: [newMessage, ...messages] });
        dispatch({ type: 'ADD_ACTIVITY', payload: { type: 'Papan Pesan', description: `Membuat pengumuman baru: "${title}"`, relatedId: newMessage.id } });
        setTitle('');
        setContent('');
        addToast({ title: 'Sukses', message: 'Pengumuman berhasil diposting.', type: 'success'});
    };

    const handleDeleteMessage = (id: string) => {
        const deletedMsg = messages.find(msg => msg.id === id);
        if (deletedMsg && window.confirm(`Anda yakin ingin menghapus pengumuman "${deletedMsg.title}"?`)) {
            dispatch({ type: 'SET_MESSAGES', payload: messages.filter(msg => msg.id !== id) });
            dispatch({ type: 'ADD_ACTIVITY', payload: { type: 'Papan Pesan', description: `Menghapus pengumuman: "${deletedMsg.title}"`, relatedId: id } });
            addToast({ title: 'Sukses', message: 'Pengumuman telah dihapus.', type: 'info'});
        }
    };
    
    if (!currentUser) return null;

    const visibleMessages = messages
        .filter(msg => 
            (!msg.recipientId || msg.recipientId === currentUser.uid) &&
            msg.action?.type !== 'CONFIRM_TERMINATION'
        )
        .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Papan Pesan</h1>
            {isAdmin && (
                <motion.div initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}} className="bg-white p-6 rounded-xl shadow-lg border space-y-4">
                    <h2 className="text-xl font-bold text-slate-700">Buat Pengumuman Baru</h2>
                    <input type="text" placeholder="Judul Pengumuman" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-slate-900 placeholder:text-slate-400"/>
                    <textarea placeholder="Tulis pesan Anda di sini..." value={content} onChange={e => setContent(e.target.value)} rows={4} className="w-full p-2 border rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-slate-900 placeholder:text-slate-400"></textarea>
                    <Button onClick={handlePostMessage} className="w-full"><Send size={18}/> Kirim Pengumuman</Button>
                </motion.div>
            )}
            <div className="space-y-4">
                <AnimatePresence>
                {visibleMessages.length > 0 ? visibleMessages.map(msg => (
                    <motion.div 
                        key={msg.id} 
                        layout
                        initial={{opacity:0, y:20}} 
                        animate={{opacity:1, y:0}} 
                        exit={{opacity: 0, x: -50}}
                        className={`bg-white p-5 rounded-xl shadow-lg border relative ${msg.recipientId === currentUser.uid ? 'border-blue-300' : ''}`}
                    >
                        {isAdmin && !msg.recipientId && <Button variant="ghost" size="sm" onClick={() => handleDeleteMessage(msg.id)} className="absolute top-2 right-2 !p-2 h-auto text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={16}/></Button>}
                        <div className="flex items-center mb-2">
                             <img src={users.find(u=>u.uid === msg.authorId)?.profilePictureUrl || `https://api.dicebear.com/8.x/initials/svg?seed=System`} alt="author" className="w-8 h-8 rounded-full mr-3"/>
                             <div>
                                <h3 className="font-bold text-lg text-slate-800">{msg.title}</h3>
                                <p className="text-xs text-slate-500">Oleh {getUsernameById(msg.authorId, users)} • {formatDate(msg.timestamp)}</p>
                             </div>
                        </div>
                        <p className="text-slate-700 whitespace-pre-wrap pt-2 border-t">{msg.content}</p>
                    </motion.div>
                )) : (
                     <div className="text-center p-12 text-slate-500 bg-white rounded-xl shadow-lg border">
                        <MessageSquare size={48} className="mx-auto text-slate-400 mb-2" />
                        <p>Belum ada pengumuman.</p>
                    </div>
                )}
                </AnimatePresence>
            </div>
        </div>
    );
};
