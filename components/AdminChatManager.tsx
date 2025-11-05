// components/AdminChatManager.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Users, ChevronLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ChatMessage, UserData } from '../types';

export const AdminChatManager = () => {
    const { state, dispatch } = useAppContext();
    const { chats, currentUser, users } = state;
    const [isOpen, setIsOpen] = useState(false);
    const [activeChatUid, setActiveChatUid] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const totalUnread = useMemo(() => {
        // FIX: Cast `session` to its expected type from `ChatSession` to resolve property access errors on 'unknown'.
        // FIX: Explicitly typed the `count` accumulator in the `reduce` function as a `number`. This resolves an issue where `count` was being inferred as `unknown`, causing a type error when performing addition.
        return Object.values(chats).reduce((count: number, session) => {
            const typedSession = session as { messages: ChatMessage[] };
            return count + typedSession.messages.filter(msg => !msg.readByAdmin).length;
        }, 0);
    }, [chats]);
    
    const activeChats = useMemo(() => {
        // FIX: Cast `session` to its expected type to resolve property access errors on 'unknown'.
        return Object.entries(chats).map(([uid, session]) => {
            const typedSession = session as { customerName: string; messages: ChatMessage[] };
            return {
                uid,
                customerName: typedSession.customerName,
                lastMessage: typedSession.messages[typedSession.messages.length - 1],
                unreadCount: typedSession.messages.filter(msg => !msg.readByAdmin).length,
            };
        }).sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime());
    }, [chats]);

    const currentChatMessages = activeChatUid ? (chats[activeChatUid] as { messages: ChatMessage[] })?.messages : [];

    useEffect(() => {
        if (activeChatUid) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            const activeChat = chats[activeChatUid] as { messages: ChatMessage[] };
            if (activeChat && activeChat.messages.some(msg => !msg.readByAdmin)) {
                dispatch({ type: 'MARK_CHAT_AS_READ', payload: { customerUid: activeChatUid, reader: 'admin' } });
            }
        }
    }, [activeChatUid, chats, dispatch]);
    
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser || !activeChatUid) return;
        const message: ChatMessage = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            authorId: currentUser.uid,
            authorName: currentUser.fullName,
            text: newMessage.trim(),
            readByAdmin: true,
            readByCustomer: false,
        };
        dispatch({ type: 'SEND_CHAT_MESSAGE', payload: { customerUid: activeChatUid, message } });
        setNewMessage('');
    };
    
    return (
        <>
            <motion.div
                layout
                onClick={() => setIsOpen(prev => !prev)}
                className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg cursor-pointer p-3 flex items-center gap-3 text-slate-800 border"
                whileHover={{ scale: 1.05 }}
            >
                <MessageSquare size={20} className="text-indigo-600" />
                {totalUnread > 0 && !isOpen && (
                    <motion.span
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
                    >
                        {totalUnread}
                    </motion.span>
                )}
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed bottom-20 right-4 w-[90vw] max-w-sm h-[70vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[100] border"
                    >
                        <header className="bg-slate-100 p-4 flex justify-between items-center flex-shrink-0 border-b">
                            {activeChatUid ? (
                                <>
                                    <button onClick={() => setActiveChatUid(null)} className="p-1 rounded-full hover:bg-slate-200"><ChevronLeft size={20} /></button>
                                    <h3 className="font-bold text-center">{(chats[activeChatUid] as { customerName: string })?.customerName || 'Chat'}</h3>
                                    <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-slate-200"><X size={20} /></button>
                                </>
                            ) : (
                                <>
                                    <h3 className="font-bold flex items-center gap-2"><Users size={18} /> Daftar Obrolan</h3>
                                    <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-slate-200"><X size={20} /></button>
                                </>
                            )}
                        </header>
                        
                        <div className="flex-grow overflow-hidden relative">
                            <AnimatePresence>
                                {!activeChatUid ? (
                                    <motion.div key="list" initial={{x: '-100%'}} animate={{x: 0}} exit={{x: '-100%'}} className="absolute inset-0 overflow-y-auto">
                                        {activeChats.length > 0 ? activeChats.map(chat => (
                                            <div key={chat.uid} onClick={() => setActiveChatUid(chat.uid)} className="flex items-center gap-3 p-3 border-b hover:bg-slate-50 cursor-pointer">
                                                <div className="relative">
                                                    <img src={users.find(u => u.uid === chat.uid)?.profilePictureUrl} className="w-10 h-10 rounded-full" />
                                                    {chat.unreadCount > 0 && <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />}
                                                </div>
                                                <div className="flex-grow">
                                                    <p className="font-semibold">{chat.customerName}</p>
                                                    <p className="text-xs text-slate-500 truncate">{chat.lastMessage.text}</p>
                                                </div>
                                            </div>
                                        )) : <p className="p-8 text-center text-slate-500">Tidak ada obrolan aktif.</p>}
                                    </motion.div>
                                ) : (
                                    <motion.div key="chat" initial={{x: '100%'}} animate={{x: 0}} exit={{x: '100%'}} className="absolute inset-0 flex flex-col">
                                        <main className="flex-grow p-3 overflow-y-auto bg-slate-50">
                                            <div className="space-y-3">
                                                {currentChatMessages.map(msg => {
                                                    const isAdmin = ['admin', 'super_admin', 'kepala_gudang'].includes(users.find(u => u.uid === msg.authorId)?.role || '');
                                                    return (
                                                        <div key={msg.id} className={`flex items-end gap-2 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                                            <div className={`max-w-[75%] p-3 rounded-2xl ${isAdmin ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-200 text-slate-800 rounded-bl-none'}`}>
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
                                                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Balas pesan..." className="flex-grow bg-slate-100 border-transparent focus:border-indigo-500 focus:ring-indigo-500 rounded-full px-4 py-2 text-sm" />
                                                <button type="submit" className="w-10 h-10 flex-shrink-0 bg-indigo-600 text-white rounded-full flex items-center justify-center disabled:opacity-50" disabled={!newMessage.trim()}><Send size={20} /></button>
                                            </form>
                                        </footer>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};