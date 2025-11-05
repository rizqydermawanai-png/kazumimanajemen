// components/ChatPopup.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, ChevronsDown } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ChatMessage } from '../types';

export const ChatPopup = () => {
    const { state, dispatch } = useAppContext();
    const { currentUser, chats } = state;
    const [isOpen, setIsOpen] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const myChat = currentUser ? chats[currentUser.uid] : null;
    const unreadCount = myChat?.messages.filter(msg => msg.authorId !== currentUser?.uid && !msg.readByCustomer).length || 0;

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            if (unreadCount > 0) {
                dispatch({ type: 'MARK_CHAT_AS_READ', payload: { customerUid: currentUser!.uid, reader: 'customer' } });
            }
        }
    }, [isOpen, myChat, unreadCount, currentUser, dispatch]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser) return;
        const message: ChatMessage = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            authorId: currentUser.uid,
            authorName: currentUser.fullName,
            text: newMessage.trim(),
            readByAdmin: false,
            readByCustomer: true,
        };
        dispatch({ type: 'SEND_CHAT_MESSAGE', payload: { customerUid: currentUser.uid, message } });
        setNewMessage('');
    };

    if (!currentUser) return null;

    return (
        <>
            <motion.div
                className="fixed bottom-6 right-6 z-[99]"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 1 }}
            >
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full shadow-xl flex items-center justify-center relative"
                    aria-label="Buka obrolan"
                >
                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.div
                                key="close-icon"
                                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                            >
                                <ChevronsDown size={28} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="open-icon"
                                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                            >
                                <MessageSquare size={28} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {!isOpen && unreadCount > 0 && (
                        <motion.span
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
                        >
                            {unreadCount}
                        </motion.span>
                    )}
                </button>
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                        className="fixed bottom-24 right-6 w-[90vw] max-w-sm h-[60vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[100] border"
                    >
                        <header className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-4 flex justify-between items-center flex-shrink-0">
                            <div>
                                <h3 className="font-bold">Butuh Bantuan?</h3>
                                <p className="text-xs opacity-80">Kami siap membantu Anda</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-white/20">
                                <X size={20} />
                            </button>
                        </header>

                        <main className="flex-grow p-3 overflow-y-auto bg-slate-50">
                            <div className="space-y-3">
                                {myChat?.messages.map((msg, index) => {
                                    const isMe = msg.authorId === currentUser.uid;
                                    return (
                                        <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[75%] p-3 rounded-2xl ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-200 text-slate-800 rounded-bl-none'}`}>
                                                <p className="text-sm">{msg.text}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        </main>

                        <footer className="p-3 border-t bg-white flex-shrink-0">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Ketik pesan Anda..."
                                    className="flex-grow bg-slate-100 border-transparent focus:border-indigo-500 focus:ring-indigo-500 rounded-full px-4 py-2 text-sm"
                                />
                                <button type="submit" className="w-10 h-10 flex-shrink-0 bg-indigo-600 text-white rounded-full flex items-center justify-center disabled:opacity-50" disabled={!newMessage.trim()}>
                                    <Send size={20} />
                                </button>
                            </form>
                        </footer>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};