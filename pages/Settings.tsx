// pages/Settings.tsx
import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { CustomInput } from '../components/ui/CustomInput';
import { CustomSelect } from '../components/ui/CustomSelect';
import { useToast } from '../hooks/useToast';
import { formatRole, formatDepartment, formatDate, formatCurrency } from '../lib/utils';
import type { UserData, Role, Department, BankAccount, PerformanceReview, Sanction, Message, PointLogEntry, CompanyInfo, AccountChangeRequest, AdditionalCost, Address, GarmentPattern } from '../types';
import { Modal } from '../components/ui/Modal';
import { Card } from '../components/ui/Card';
import { KeyRound, CheckCircle, UserPlus, Trash2, CreditCard, Star, ShieldAlert, Printer, AlertTriangle, Award, UserX, Clock, Send, TrendingUp, Building, MailOpen, UserCheck, UserX as UserXIcon, Save, SlidersHorizontal, Weight } from 'lucide-react';
import { printTerminationLetter } from '../lib/print';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { AddressForm } from '../components/AddressForm';

interface SettingsPageProps {
    currentUser: UserData;
    setCurrentUser: React.Dispatch<React.SetStateAction<UserData | null>>;
    users: UserData[];
    setUsers: React.Dispatch<React.SetStateAction<UserData[]>>;
    addActivity: (type: string, description: string, id?: string) => void;
    initialTab: 'myProfile' | 'accountManagement' | 'companySettings' | 'stockSettings' | 'productionSettings';
    bankAccounts: BankAccount[];
    setBankAccounts: React.Dispatch<React.SetStateAction<BankAccount[]>>;
    showPrintPreview: (htmlContent: string, title: string) => void;
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    onViewEmployeePerformance: (userId: string) => void;
}

const RequestChangeModal = ({
    isOpen,
    onClose,
    type,
    currentUser,
}: {
    isOpen: boolean;
    onClose: () => void;
    type: 'username' | 'password';
    currentUser: UserData;
}) => {
    const { dispatch, state } = useAppContext();
    const { accountChangeRequests, users } = state;
    const { addToast } = useToast();
    const [newValue, setNewValue] = useState('');
    const [reason, setReason] = useState('');

    const handleSubmit = () => {
        if (!newValue.trim() || !reason.trim()) {
            addToast({ title: 'Error', message: 'Nilai baru dan alasan harus diisi.', type: 'error' });
            return;
        }

        if (type === 'username' && users.some(u => u.username.toLowerCase() === newValue.toLowerCase())) {
             addToast({ title: 'User ID Telah Digunakan', message: 'User ID yang Anda minta sudah digunakan oleh akun lain.', type: 'error' });
             return;
        }

        const existingRequest = accountChangeRequests.find(req => req.userId === currentUser.uid && req.status === 'pending');
        if (existingRequest) {
            addToast({ title: 'Permintaan Sudah Ada', message: `Anda sudah memiliki permintaan perubahan akun yang sedang diproses.`, type: 'warning' });
            return;
        }

        const newRequest: AccountChangeRequest = {
            id: crypto.randomUUID(),
            userId: currentUser.uid,
            username: currentUser.username,
            type: type,
            newValue: newValue,
            reason: reason,
            status: 'pending',
            requestedAt: new Date().toISOString(),
        };

        dispatch({ type: 'SET_ACCOUNT_CHANGE_REQUESTS', payload: prev => [...prev, newRequest] });
        addToast({ title: 'Permintaan Terkirim', message: 'Permintaan Anda telah dikirim ke admin untuk persetujuan.', type: 'success' });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Permintaan Ubah ${type === 'username' ? 'User ID' : 'Password'}`}>
            <div className="space-y-4">
                <CustomInput
                    label={type === 'username' ? 'User ID Baru' : 'Password Baru'}
                    type={type === 'password' ? 'password' : 'text'}
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                />
                <label className="block text-sm font-medium text-slate-600 mb-1">Alasan Perubahan</label>
                <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Jelaskan mengapa Anda memerlukan perubahan ini..."
                />
                 <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="secondary" onClick={onClose}>Batal</Button>
                    <Button onClick={handleSubmit}>Kirim Permintaan</Button>
                </div>
            </div>
        </Modal>
    );
};


const MyProfile = ({ currentUser, setCurrentUser, setUsers, addActivity }: Omit<SettingsPageProps, 'users'| 'initialTab' | 'bankAccounts' | 'setBankAccounts' | 'showPrintPreview' | 'messages' | 'setMessages' | 'onViewEmployeePerformance'>) => {
    const [form, setForm] = useState({ fullName: currentUser.fullName, email: currentUser.email, whatsapp: currentUser.whatsapp, bio: currentUser.bio || '', profilePictureUrl: currentUser.profilePictureUrl, address: currentUser.address || { streetAndBuilding: '', houseNumber: '', rt: '', rw: '', subdistrict: '', district: '', city: '', province: '', postalCode: '', country: 'Indonesia' } });
    const { addToast } = useToast();
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [requestType, setRequestType] = useState<'username' | 'password'>('username');

    const handleProfileUpdate = () => {
        const updatedUser = { ...currentUser, ...form };
        setCurrentUser(updatedUser);
        setUsers(prevUsers => prevUsers.map(u => u.uid === currentUser.uid ? updatedUser : u));
        addActivity('Manajemen Akun', 'Memperbarui profil pribadi');
        addToast({ title: 'Profil Diperbarui', message: 'Informasi profil Anda telah berhasil disimpan.', type: 'success' });
    };
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 1024 * 1024) { // 1MB limit
            addToast({ title: 'File Terlalu Besar', message: 'Ukuran file tidak boleh melebihi 1MB.', type: 'error' });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
               setForm(prevForm => ({ ...prevForm, profilePictureUrl: reader.result as string }));
               addToast({ title: 'Gambar Siap', message: 'Klik "Simpan Perubahan" untuk menerapkan foto profil baru.', type: 'info' });
            }
        };
        reader.onerror = () => {
            addToast({ title: 'Error', message: 'Gagal membaca file.', type: 'error' });
        };
        // FIX: Correct typo from `readDataURL` to `readAsDataURL`
        reader.readAsDataURL(file);
    };

    const openRequestModal = (type: 'username' | 'password') => {
        if (currentUser.role === 'super_admin') {
            addToast({ title: 'Aksi Tidak Diizinkan', message: 'Super Admin tidak dapat mengajukan perubahan untuk akunnya sendiri.', type: 'warning' });
            return;
        }
        setRequestType(type);
        setIsRequestModalOpen(true);
    };

    const handleAddressChange = (newAddress: Partial<Address>) => {
        setForm(prev => ({ ...prev, address: { ...prev.address, ...newAddress }}));
    };

    return (
        <Card>
            <h2 className="text-xl font-bold text-slate-700 mb-4">Edit Profil</h2>
             <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <img src={form.profilePictureUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${form.fullName}`} alt="Preview" className="w-20 h-20 rounded-full bg-slate-200 object-cover" onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/8.x/initials/svg?seed=${form.fullName}`; }}/>
                    <div className="flex-grow">
                        <label className="block text-sm font-medium text-slate-600 mb-1">Ubah Foto Profil</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="file"
                                id="profilePictureUpload"
                                className="hidden"
                                accept="image/png, image/jpeg, image/webp"
                                onChange={handleImageUpload}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById('profilePictureUpload')?.click()}
                            >
                                Pilih File...
                            </Button>
                            <p className="text-xs text-slate-500">Maks 1MB.</p>
                        </div>
                    </div>
                </div>
                <CustomInput label="Nama Lengkap" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} />
                <CustomInput label="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                <CustomInput label="WhatsApp" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} />
                <label className="block text-sm font-medium text-slate-600 mb-1">Bio</label>
                <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} rows={3} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900" />

                <div className="pt-4 border-t">
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Alamat Pengiriman Utama</h3>
                    <AddressForm address={form.address} onAddressChange={handleAddressChange} />
                </div>

                <Button onClick={handleProfileUpdate}>Simpan Perubahan</Button>
            </div>

            <div className="pt-6 mt-6 border-t">
                 <h3 className="text-lg font-semibold text-slate-700 mb-2">Pengaturan Akun</h3>
                 <p className="text-sm text-slate-500 mb-4">Perubahan User ID atau Password memerlukan persetujuan dari Administrator.</p>
                 <div className="flex flex-wrap gap-4">
                    <Button variant="outline" onClick={() => openRequestModal('username')}>Ubah User ID</Button>
                    <Button variant="outline" onClick={() => openRequestModal('password')}>Ubah Password</Button>
                </div>
            </div>

            <RequestChangeModal
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                type={requestType}
                currentUser={currentUser}
            />
        </Card>
    );
}

const StatusBadge = ({ status }: { status: UserData['status'] }) => {
    if (status === 'pending_termination') {
        return <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Menunggu Konfirmasi</span>;
    }
    if (status === 'terminated') {
        return <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Dihentikan</span>;
    }
    return null;
};

const UserTable = ({ users, onSelectUser, showPoints = false, showStatus = false, onViewPerformance }: { users: UserData[], onSelectUser: (user: UserData) => void, showPoints?: boolean, showStatus?: boolean, onViewPerformance?: (userId: string) => void }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[700px]">
            <thead className="bg-slate-50 border-y">
                <tr className="text-slate-600">
                    <th className="p-4 font-semibold">Pengguna</th>
                    <th className="p-4 font-semibold">Role</th>
                    <th className="p-4 font-semibold">Terdaftar</th>
                    {showPoints && <th className="p-4 font-semibold text-center">Poin</th>}
                    {showStatus && <th className="p-4 font-semibold">Status</th>}
                    <th className="p-4 font-semibold"></th>
                </tr>
            </thead>
            <tbody>
                {users.map(user => (
                    <tr key={user.uid} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                            <div className="flex items-center">
                                <img src={user.profilePictureUrl} alt={user.fullName} className="w-8 h-8 rounded-full mr-3 object-cover" />
                                <div>
                                    <p className="font-semibold">{user.fullName}</p>
                                    <p className="text-xs text-slate-500 font-normal">@{user.username}</p>
                                </div>
                            </div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                            {formatRole(user.role)}
                            <br />
                            <span className="text-xs text-slate-500">{formatDepartment(user.department)}</span>
                        </td>
                        <td className="p-4 text-slate-500 whitespace-nowrap">{formatDate(user.createdAt)}</td>
                        {showPoints && (
                            <td className="p-4">
                                <div className="flex items-center justify-center">
                                {user.performanceScore ? (
                                    <div className={`flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm text-white ${
                                        (user.performanceScore.totalPoints ?? 0) >= 80 ? 'bg-green-500' :
                                        (user.performanceScore.totalPoints ?? 0) >= 60 ? 'bg-blue-500' :
                                        (user.performanceScore.totalPoints ?? 0) >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}>
                                        {Math.round(user.performanceScore.totalPoints ?? 0)}
                                    </div>
                                ) : (
                                    <span className="text-slate-400">-</span>
                                )}
                                </div>
                            </td>
                        )}
                        {showStatus && (
                            <td className="p-4">
                                <StatusBadge status={user.status} />
                            </td>
                        )}
                        <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                                {showPoints && onViewPerformance && (
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="!p-2"
                                        onClick={() => onViewPerformance(user.uid)} 
                                        title="Lihat Detail Kinerja"
                                    >
                                        <TrendingUp size={16} />
                                    </Button>
                                )}
                                <Button size="sm" variant="outline" onClick={() => onSelectUser(user)}>Kelola</Button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        {users.length === 0 && <p className="text-center text-slate-500 py-8">Tidak ada pengguna dalam kategori ini.</p>}
    </div>
);

const AccountManagement = ({ users, onSelectUser, isSuperAdmin, onViewPerformance }: { users: UserData[], onSelectUser: (user: UserData) => void, isSuperAdmin: boolean, onViewPerformance: (userId: string) => void }) => {
    const [activeTab, setActiveTab] = useState<'staff' | 'customers' | 'requests' | 'termination'>('staff');
    const { state, dispatch } = useAppContext();
    const { accountChangeRequests } = state;
    const { addToast } = useToast();

    const getStatus = (u: UserData) => u.status ?? 'active';

    const staffUsers = users.filter(u => !['customer', 'pending'].includes(u.role) && getStatus(u) === 'active');
    const customerUsers = users.filter(u => u.role === 'customer' && getStatus(u) === 'active');
    const pendingUsers = users.filter(u => u.role === 'pending');
    
    const terminationProcessUsers = users
        .filter(u => ['pending_termination', 'terminated'].includes(getStatus(u)))
        .sort((a, b) => {
            if (a.status === 'pending_termination' && b.status !== 'pending_termination') return -1;
            if (a.status !== 'pending_termination' && b.status === 'pending_termination') return 1;
            return 0;
        });
    
    const pendingRequests = accountChangeRequests.filter(req => req.status === 'pending');

    const handleReviewRequest = (req: AccountChangeRequest, decision: 'approved' | 'rejected') => {
        const userToUpdate = users.find(u => u.uid === req.userId);
        if (!userToUpdate) return;

        if (decision === 'approved') {
            let updates: Partial<UserData> = {};
            let messageContent = '';

            if (req.type === 'username') {
                updates.username = req.newValue;
                messageContent = `Permintaan perubahan User ID Anda telah disetujui. User ID baru Anda adalah: "${req.newValue}".`;
            } else if (req.type === 'password') { // Change from profile
                updates.password = req.newValue;
                messageContent = `Permintaan perubahan Password Anda telah disetujui. Password Anda telah diperbarui.`;
            } else if (req.type === 'password_reset') { // Forgot password flow
                // Only set the flag, do NOT change the password
                updates.forcePasswordChange = true;
                messageContent = `Permintaan reset password Anda telah disetujui. Silakan login kembali menggunakan password LAMA Anda untuk membuat password baru.`;
            }

            // Apply updates if any
            if (Object.keys(updates).length > 0) {
                dispatch({ type: 'SET_USERS', payload: prev => prev.map(u => u.uid === req.userId ? { ...u, ...updates } : u) });
            }
            
            // Send a notification message if there's content for it
            if (messageContent) {
                const systemMessage: Message = {
                    id: crypto.randomUUID(),
                    timestamp: new Date().toISOString(),
                    authorId: 'system',
                    recipientId: req.userId,
                    title: `Persetujuan: Permintaan Perubahan Akun`,
                    content: messageContent,
                };
                dispatch({type: 'SET_MESSAGES', payload: prev => [...prev, systemMessage]});
            }
        }
        
        // Update the request status regardless of decision
        dispatch({ type: 'SET_ACCOUNT_CHANGE_REQUESTS', payload: prev => prev.map(r => r.id === req.id ? {...r, status: decision, reviewedBy: state.currentUser?.uid, reviewedAt: new Date().toISOString()} : r)});
        addToast({ title: 'Berhasil', message: `Permintaan telah di-${decision === 'approved' ? 'setujui' : 'tolak'}.`, type: 'success' });
    };


    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200/80 overflow-hidden">
            <div className="p-4 border-b">
                <h2 className="text-xl font-bold text-slate-700">Manajemen Akun</h2>
            </div>
            <div className="flex border-b flex-wrap">
                <button
                    onClick={() => setActiveTab('staff')}
                    className={`flex-1 p-3 font-semibold text-center transition-colors duration-300 relative flex items-center justify-center gap-2 ${activeTab === 'staff' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
                >
                    Staf ({staffUsers.length})
                    {activeTab === 'staff' && <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" layoutId="am-tab" />}
                </button>
                <button
                    onClick={() => setActiveTab('customers')}
                    className={`flex-1 p-3 font-semibold text-center transition-colors duration-300 relative flex items-center justify-center gap-2 ${activeTab === 'customers' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
                >
                    Pelanggan ({customerUsers.length})
                    {pendingUsers.length > 0 && <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">{pendingUsers.length}</span>}
                    {activeTab === 'customers' && <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" layoutId="am-tab" />}
                </button>
                 <button
                    onClick={() => setActiveTab('requests')}
                    className={`flex-1 p-3 font-semibold text-center transition-colors duration-300 relative flex items-center justify-center gap-2 ${activeTab === 'requests' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
                >
                    <MailOpen size={16}/> Permintaan ({pendingRequests.length})
                    {pendingRequests.length > 0 && <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">{pendingRequests.length}</span>}
                    {activeTab === 'requests' && <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" layoutId="am-tab" />}
                </button>
                {isSuperAdmin && (
                     <button
                        onClick={() => setActiveTab('termination')}
                        className={`flex-1 p-3 font-semibold text-center transition-colors duration-300 relative flex items-center justify-center gap-2 ${activeTab === 'termination' ? 'text-red-600' : 'text-slate-500 hover:text-red-600'}`}
                    >
                        <UserX size={16}/> Pemberhentian ({terminationProcessUsers.length})
                        {activeTab === 'termination' && <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" layoutId="am-tab" />}
                    </button>
                )}
            </div>
            
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-0 sm:p-4"
                >
                    {activeTab === 'staff' && (
                        <UserTable users={staffUsers} onSelectUser={onSelectUser} showPoints={true} onViewPerformance={onViewPerformance} />
                    )}
                    {activeTab === 'customers' && (
                        <div className="space-y-6">
                            {pendingUsers.length > 0 && (
                                <div className="bg-white p-4 rounded-xl border border-yellow-300 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-700 mb-2 flex items-center">
                                        <UserPlus size={20} className="mr-2 text-yellow-500"/> Akun Menunggu Persetujuan
                                    </h3>
                                    <div className="space-y-2">
                                        {pendingUsers.map(user => (
                                            <div key={user.uid} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                                <div>
                                                    <p className="font-semibold">{user.fullName} <span className="text-slate-500 font-normal">(@{user.username})</span></p>
                                                    <p className="text-sm text-slate-600">Calon Pelanggan</p>
                                                </div>
                                                <Button size="sm" onClick={() => onSelectUser(user)}>Tinjau</Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                             <div className="bg-white p-4 rounded-xl border shadow-sm">
                                <h3 className="text-lg font-bold text-slate-700 mb-2">Pelanggan Terdaftar</h3>
                                <UserTable users={customerUsers} onSelectUser={onSelectUser} />
                            </div>
                        </div>
                    )}
                    {activeTab === 'requests' && (
                        <div className="p-4 space-y-3">
                             {pendingRequests.length > 0 ? pendingRequests.map(req => (
                                <div key={req.id} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <div className="flex justify-between items-start flex-wrap gap-2">
                                        <div>
                                            <p className="font-bold text-blue-800">Permintaan Ubah {req.type === 'username' ? 'User ID' : req.type === 'password' ? 'Password' : 'Reset Password'}</p>
                                            <p className="text-sm font-semibold">dari: {req.username}</p>
                                            <p className="text-xs text-slate-500">{formatDate(req.requestedAt)}</p>
                                        </div>
                                         <div className="flex gap-2">
                                            <Button size="sm" variant="danger" onClick={() => handleReviewRequest(req, 'rejected')}><UserXIcon size={14}/> Tolak</Button>
                                            <Button size="sm" variant="primary" className="bg-green-600 hover:bg-green-700" onClick={() => handleReviewRequest(req, 'approved')}><UserCheck size={14}/> Setujui</Button>
                                        </div>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-blue-200 text-sm space-y-1">
                                        {req.reason && <p><strong>Alasan:</strong> {req.reason}</p>}
                                        <p><strong>Nilai Baru:</strong> <span className="font-mono bg-blue-100 px-1 rounded">{req.newValue}</span></p>
                                    </div>
                                </div>
                             )) : <p className="text-center text-slate-500 py-8">Tidak ada permintaan yang menunggu persetujuan.</p>}
                        </div>
                    )}
                    {activeTab === 'termination' && isSuperAdmin && (
                        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm">
                            <h3 className="text-lg font-bold text-red-700 mb-2">Proses & Arsip Pemberhentian</h3>
                            <UserTable users={terminationProcessUsers} onSelectUser={onSelectUser} showStatus={true} />
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

// FIX: Implement missing components to make SettingsPage functional
const BankAccountManagement = ({ bankAccounts, setBankAccounts, addActivity }: Pick<SettingsPageProps, 'bankAccounts' | 'setBankAccounts' | 'addActivity'>) => {
    // Basic implementation for Bank Account Management
    return (
        <Card>
            <h2 className="text-xl font-bold text-slate-700 mb-4">Rekening Bank Perusahaan</h2>
            <p className="text-slate-500">Fitur ini sedang dalam pengembangan.</p>
        </Card>
    );
};

const CompanySettings = ({ companyInfo, setCompanyInfo, addActivity }: { companyInfo: CompanyInfo, setCompanyInfo: (info: CompanyInfo) => void, addActivity: (type: string, description: string, id?: string) => void }) => {
    const [form, setForm] = useState(companyInfo);
    const { addToast } = useToast();

    const handleSave = () => {
        setCompanyInfo(form);
        addToast({title: 'Sukses', message: 'Informasi perusahaan berhasil diperbarui', type: 'success'});
        addActivity('Pengaturan', 'Memperbarui informasi perusahaan');
    };

    return (
        <Card>
            <h2 className="text-xl font-bold text-slate-700 mb-4">Informasi Perusahaan</h2>
            <div className="space-y-4">
                <CustomInput label="Nama Perusahaan" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                <CustomInput label="Alamat" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                <CustomInput label="Telepon" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                <CustomInput label="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                <CustomInput label="URL Google Maps Embed" value={form.googleMapsEmbedUrl} onChange={e => setForm({...form, googleMapsEmbedUrl: e.target.value})} />
                <Button onClick={handleSave}><Save size={16}/> Simpan Informasi</Button>
            </div>
        </Card>
    );
}

const StockThresholdSettings = () => {
    const { state, dispatch } = useAppContext();
    const { stockThresholds } = state;
    const { addToast } = useToast();
    
    const [thresholds, setThresholds] = useState(stockThresholds);

    const handleSave = () => {
        dispatch({ type: 'SET_STOCK_THRESHOLDS', payload: thresholds });
        addToast({ title: 'Sukses', message: 'Ambang batas peringatan stok telah diperbarui.', type: 'success' });
    };

    return (
        <Card>
            <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">
                <SlidersHorizontal />
                Ambang Batas Peringatan Stok
            </h2>
            <p className="text-sm text-slate-500 mb-6">
                Atur jumlah stok minimum sebelum sistem memberikan peringatan "Stok Menipis" di halaman gudang.
            </p>
            <div className="space-y-4 max-w-md">
                <CustomInput 
                    label="Stok Minimum Material Mentah"
                    type="number"
                    value={thresholds.materials}
                    onChange={e => setThresholds(prev => ({ ...prev, materials: Number(e.target.value) || 0 }))}
                    min="0"
                />
                <CustomInput 
                    label="Stok Minimum Barang Jadi (per varian)"
                    type="number"
                    value={thresholds.finishedGoods}
                    onChange={e => setThresholds(prev => ({ ...prev, finishedGoods: Number(e.target.value) || 0 }))}
                    min="0"
                />
                <Button onClick={handleSave} className="mt-2"><Save size={16}/> Simpan Pengaturan</Button>
            </div>
        </Card>
    );
};

const GarmentWeightSettings = () => {
    const { state, dispatch } = useAppContext();
    const { garmentPatterns } = state;
    const { addToast } = useToast();
    
    const [localPatterns, setLocalPatterns] = useState(garmentPatterns);

    const handleWeightChange = (key: string, weight: number) => {
        setLocalPatterns(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                defaultWeight: weight
            }
        }));
    };

    const handleSave = () => {
        dispatch({ type: 'SET_GARMENT_PATTERNS', payload: localPatterns });
        addToast({ title: 'Sukses', message: 'Berat standar pakaian telah diperbarui.', type: 'success' });
        dispatch({ type: 'ADD_ACTIVITY', payload: {type: 'Pengaturan', description: `Memperbarui berat standar pakaian.`} });
    };

    return (
        <Card>
            <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Weight />
                Pengaturan Berat Standar Pakaian
            </h2>
            <p className="text-sm text-slate-500 mb-6">
                Atur berat standar (dalam gram) untuk setiap jenis pakaian. Berat ini akan digunakan sebagai default saat membuat produk baru dan untuk perhitungan ongkos kirim.
            </p>
            <div className="space-y-4 max-w-md">
                {Object.entries(localPatterns).map(([key, pattern]) => (
                    <CustomInput 
                        key={key}
// FIX: Cast `pattern` to `GarmentPattern` to resolve property access errors.
                        label={`Berat Standar ${(pattern as GarmentPattern).title} (gram)`}
                        type="number"
// FIX: Cast `pattern` to `GarmentPattern` to resolve property access errors.
                        value={(pattern as GarmentPattern).defaultWeight}
                        onChange={e => handleWeightChange(key, Number(e.target.value) || 0)}
                        min="0"
                    />
                ))}
                <Button onClick={handleSave} className="mt-2"><Save size={16}/> Simpan Pengaturan Berat</Button>
            </div>
        </Card>
    );
}

const ProductionCostSettings = () => {
    const { state, dispatch } = useAppContext();
    const { standardProductionCosts, standardProfitMargin } = state;
    const { addToast } = useToast();
    
    const [costs, setCosts] = useState<AdditionalCost[]>(standardProductionCosts.map(c => ({...c, id: crypto.randomUUID()})));
    const [margin, setMargin] = useState(standardProfitMargin);

    const handleCostChange = (id: string, field: 'name' | 'cost', value: string | number) => {
        setCosts(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const addCostItem = () => {
        setCosts(prev => [...prev, { id: crypto.randomUUID(), name: '', cost: 0 }]);
    };

    const removeCostItem = (id: string) => {
        setCosts(prev => prev.filter(item => item.id !== id));
    };

    const handleSave = () => {
        const validCosts = costs.filter(c => c.name.trim() && c.cost >= 0);
        dispatch({ type: 'SET_STANDARD_PRODUCTION_COSTS', payload: validCosts });
        dispatch({ type: 'SET_STANDARD_PROFIT_MARGIN', payload: margin });
        addToast({ title: 'Sukses', message: 'Pengaturan produksi standar telah diperbarui.', type: 'success' });
    };

    return (
        <Card>
            <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">
                <SlidersHorizontal />
                Pengaturan Produksi Standar
            </h2>
            <p className="text-sm text-slate-500 mb-6">
                Atur nilai default yang akan otomatis muncul di halaman kalkulator HPP.
            </p>
            <div className="space-y-6">
                <div>
                    <h3 className="font-semibold text-slate-600 mb-2">Margin Profit Standar (%)</h3>
                    <CustomInput 
                        type="number"
                        value={margin}
                        onChange={e => setMargin(Number(e.target.value) || 0)}
                        placeholder="Contoh: 70"
                        className="max-w-xs"
                    />
                </div>

                <div className="pt-4 border-t">
                    <h3 className="font-semibold text-slate-600 mb-2">Daftar Biaya Tambahan Standar (per Pcs)</h3>
                    <div className="space-y-2 max-w-lg">
                        {costs.map(item => (
                            <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 items-end">
                                <CustomInput label="Nama Biaya" placeholder="Contoh: Biaya Jahit" value={item.name} onChange={e => handleCostChange(item.id, 'name', e.target.value)} />
                                <CustomInput label="Biaya (Rp)" type="number" placeholder="2500" value={item.cost} onChange={e => handleCostChange(item.id, 'cost', Number(e.target.value) || 0)} />
                                <Button variant="ghost" size="sm" className="!p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 mb-1" onClick={() => removeCostItem(item.id)}><Trash2 size={16} /></Button>
                            </motion.div>
                        ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={addCostItem} className="mt-4">Tambah Biaya</Button>
                </div>
            </div>
            <div className="mt-6 pt-4 border-t">
                 <Button onClick={handleSave}><Save size={16}/> Simpan Pengaturan Produksi</Button>
            </div>
        </Card>
    );
};


const UserManagementModal = ({ user, onClose, onSave, showPrintPreview }: { user: UserData, onClose: () => void, onSave: (updatedUser: UserData) => void, showPrintPreview: (html: string, title: string) => void }) => {
    const { state, dispatch } = useAppContext();
    const { addToast } = useToast();
    const [editedUser, setEditedUser] = useState(user);

    const handleSave = () => {
        onSave(editedUser);
    };
    
    const handleApprove = () => {
        onSave({ ...editedUser, isApproved: true, role: editedUser.role === 'pending' ? (editedUser.department ? 'member' : 'customer') : editedUser.role });
    };

    return (
        <Modal isOpen={!!user} onClose={onClose} title={`Kelola: ${user.fullName}`}>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {user.role === 'pending' && (
                    <div className="bg-yellow-50 p-4 rounded-lg text-center">
                        <p className="font-semibold text-yellow-800">Tinjau Pendaftaran Akun</p>
                        <p className="text-sm text-yellow-700 mb-4">Setujui akun ini untuk memberikan akses ke sistem.</p>
                        <Button onClick={handleApprove} className="w-full"><CheckCircle size={16}/> Setujui Akun</Button>
                    </div>
                )}
                 <CustomInput label="Nama Lengkap" value={editedUser.fullName} onChange={e => setEditedUser({...editedUser, fullName: e.target.value})} />
                 <CustomInput label="User ID" value={editedUser.username} disabled />
                 <CustomSelect label="Role" value={editedUser.role} onChange={e => setEditedUser({...editedUser, role: e.target.value as Role})}>
                    <option value="customer">Customer</option>
                    <option value="member">Member</option>
                    <option value="penjualan">Staf Penjualan</option>
                    <option value="kepala_gudang">Kepala Gudang</option>
                    <option value="kepala_produksi">Kepala Produksi</option>
                    <option value="kepala_penjualan">Kepala Penjualan</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                 </CustomSelect>
                 <CustomSelect label="Departemen" value={editedUser.department || ''} onChange={e => setEditedUser({...editedUser, department: e.target.value as Department})}>
                    <option value="">-- Tidak ada --</option>
                    <option value="produksi">Produksi</option>
                    <option value="gudang">Gudang</option>
                    <option value="penjualan">Penjualan</option>
                 </CustomSelect>
                 <CustomInput label="Gaji Pokok" type="number" value={editedUser.baseSalary || 0} onChange={e => setEditedUser({...editedUser, baseSalary: Number(e.target.value)})} />
            </div>
             <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                <Button variant="secondary" onClick={onClose}>Batal</Button>
                <Button onClick={handleSave}>Simpan Perubahan</Button>
            </div>
        </Modal>
    );
};

// FIX: Added the missing SettingsPage component and exported it to resolve the import error.
export const SettingsPage = (props: SettingsPageProps) => {
    const { initialTab, currentUser, users, setUsers, addActivity, showPrintPreview, bankAccounts, setBankAccounts, onViewEmployeePerformance } = props;
    const { state, dispatch } = useAppContext();

    const [activeTab, setActiveTab] = useState(initialTab);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const { addToast } = useToast();

    const handleSelectUser = (user: UserData) => setSelectedUser(user);
    const handleCloseUserModal = () => setSelectedUser(null);
    
    const handleSaveUser = (updatedUser: UserData) => {
        setUsers(prev => prev.map(u => u.uid === updatedUser.uid ? updatedUser : u));
        addToast({ title: 'Sukses', message: `Data untuk ${updatedUser.fullName} telah diperbarui.`, type: 'success' });
        addActivity('Manajemen Akun', `Memperbarui data pengguna: ${updatedUser.username}`, updatedUser.uid);
        handleCloseUserModal();
    };

    const isSuperAdmin = currentUser.role === 'super_admin';
    const isAdmin = isSuperAdmin || currentUser.role === 'admin';
    const isKepalaGudang = currentUser.role === 'kepala_gudang';

    const renderContent = () => {
        switch(activeTab) {
            case 'myProfile':
                return <MyProfile {...props} />;
            case 'accountManagement':
                return <AccountManagement users={users} onSelectUser={handleSelectUser} isSuperAdmin={isSuperAdmin} onViewPerformance={onViewEmployeePerformance} />;
            case 'companySettings':
                return <CompanySettings companyInfo={state.companyInfo} setCompanyInfo={(info) => dispatch({type: 'SET_COMPANY_INFO', payload: info})} addActivity={addActivity} />;
            case 'stockSettings':
                return <StockThresholdSettings />;
            case 'productionSettings':
                return (
                    <div className="space-y-6">
                        <ProductionCostSettings />
                        <GarmentWeightSettings />
                    </div>
                );
            default:
                return <MyProfile {...props} />;
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Pengaturan</h1>
            <div className="bg-white p-2 rounded-xl shadow-md flex gap-2 flex-wrap">
                <Button variant={activeTab === 'myProfile' ? 'primary' : 'ghost'} onClick={() => setActiveTab('myProfile')}>Profil Saya</Button>
                {isAdmin && <Button variant={activeTab === 'accountManagement' ? 'primary' : 'ghost'} onClick={() => setActiveTab('accountManagement')}>Manajemen Akun</Button>}
                {(isAdmin || isKepalaGudang) && <Button variant={activeTab === 'stockSettings' ? 'primary' : 'ghost'} onClick={() => setActiveTab('stockSettings')}>Pengaturan Stok</Button>}
                {isSuperAdmin && <Button variant={activeTab === 'productionSettings' ? 'primary' : 'ghost'} onClick={() => setActiveTab('productionSettings')}>Pengaturan Produksi</Button>}
                {isSuperAdmin && <Button variant={activeTab === 'companySettings' ? 'primary' : 'ghost'} onClick={() => setActiveTab('companySettings')}>Info Perusahaan</Button>}
            </div>
            
            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                    {renderContent()}
                </motion.div>
            </AnimatePresence>

            {selectedUser && (
                <UserManagementModal 
                    user={selectedUser}
                    onClose={handleCloseUserModal}
                    onSave={handleSaveUser}
                    showPrintPreview={showPrintPreview}
                />
            )}
        </div>
    );
};