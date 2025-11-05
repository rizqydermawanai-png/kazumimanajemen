// pages/WarrantyClaimsPage.tsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../hooks/useToast';
import { formatDate, getUsernameById } from '../lib/utils';
import type { WarrantyClaim, WarrantyClaimStatus, WarrantyClaimReason } from '../types';
import { useAppContext } from '../context/AppContext';
import { ShieldAlert, Check, X, Clock, ThumbsUp, ThumbsDown } from 'lucide-react';

const getStatusBadge = (status: WarrantyClaimStatus) => {
    const styles: { [key in WarrantyClaimStatus]: string } = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'approved': 'bg-green-100 text-green-800',
        'rejected': 'bg-red-100 text-red-800',
    };
    return <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${styles[status]}`}>{status}</span>;
};

const reasonLabels: Record<WarrantyClaimReason, string> = {
    'defective': 'Produk Cacat',
    'wrong_size': 'Salah Ukuran',
    'wrong_item': 'Salah Kirim Barang',
    'not_as_described': 'Tidak Sesuai Deskripsi',
    'other': 'Lainnya',
};

export const WarrantyClaimsPage = () => {
    const { state, dispatch } = useAppContext();
    const { warrantyClaims, users } = state;

    const [view, setView] = useState<WarrantyClaimStatus>('pending');
    const [selectedClaim, setSelectedClaim] = useState<WarrantyClaim | null>(null);
    const [adminNotes, setAdminNotes] = useState('');
    const { addToast } = useToast();

    const filteredClaims = useMemo(() => 
        warrantyClaims.filter(c => c.status === view)
            .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
        [warrantyClaims, view]
    );

    const handleReview = (decision: 'approved' | 'rejected') => {
        if (!selectedClaim) return;
        dispatch({
            type: 'UPDATE_WARRANTY_CLAIM_STATUS',
            payload: { claimId: selectedClaim.id, status: decision, adminNotes }
        });
        addToast({ title: 'Berhasil', message: `Klaim telah ${decision === 'approved' ? 'disetujui' : 'ditolak'}.`, type: 'success' });
        setSelectedClaim(null);
        setAdminNotes('');
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3"><ShieldAlert/> Klaim Garansi Pelanggan</h1>
            
            <div className="bg-white p-2 rounded-xl shadow-md flex gap-2 flex-wrap">
                {(['pending', 'approved', 'rejected'] as WarrantyClaimStatus[]).map(status => (
                    <Button
                        key={status}
                        variant={view === status ? 'primary' : 'ghost'}
                        onClick={() => setView(status)}
                        className="flex-1 capitalize"
                    >
                        {status === 'pending' ? 'Menunggu Tinjauan' : status}
                    </Button>
                ))}
            </div>

            <AnimatePresence>
                <div className="space-y-4">
                    {filteredClaims.length > 0 ? filteredClaims.map(claim => (
                        <motion.div
                            key={claim.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            <Card className="p-4 cursor-pointer hover:border-indigo-400" onClick={() => setSelectedClaim(claim)}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-slate-800">{claim.productName}</p>
                                        <p className="text-sm text-slate-500">Order #{claim.orderId}</p>
                                        <p className="text-xs text-slate-500">Oleh: {claim.customerName}</p>
                                    </div>
                                    <div className="text-right">
                                        {getStatusBadge(claim.status)}
                                        <p className="text-xs text-slate-500 mt-1">{formatDate(claim.submittedAt)}</p>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )) : (
                        <Card className="text-center p-12 text-slate-500">
                            <Clock size={32} className="mx-auto mb-2"/>
                            <p>Tidak ada klaim dengan status ini.</p>
                        </Card>
                    )}
                </div>
            </AnimatePresence>

            {selectedClaim && (
                <Modal isOpen={!!selectedClaim} onClose={() => setSelectedClaim(null)} title={`Detail Klaim #${selectedClaim.id}`}>
                    <div className="space-y-4 text-sm">
                        <img src={selectedClaim.photoProofUrl} alt="Bukti Klaim" className="rounded-lg w-full max-h-80 object-contain bg-slate-100" />

                        <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                            <p><strong>Pelanggan:</strong> {selectedClaim.customerName}</p>
                            <p><strong>Produk:</strong> {selectedClaim.productName}</p>
                            <p><strong>Alasan:</strong> {reasonLabels[selectedClaim.reason]}</p>
                            <p><strong>Tanggal Diajukan:</strong> {formatDate(selectedClaim.submittedAt)}</p>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold text-slate-700 mb-1">Deskripsi dari Pelanggan:</h4>
                            <p className="p-3 bg-slate-50 rounded-lg whitespace-pre-wrap">{selectedClaim.description}</p>
                        </div>

                        {selectedClaim.status !== 'pending' && (
                             <div>
                                <h4 className="font-semibold text-slate-700 mb-1">Catatan Admin:</h4>
                                <p className="p-3 bg-slate-50 rounded-lg whitespace-pre-wrap">
                                    {selectedClaim.adminNotes || '-'}
                                    <span className="block text-xs text-slate-500 mt-1">
                                        Ditinjau oleh {getUsernameById(selectedClaim.reviewedBy || '', users)} pada {formatDate(selectedClaim.reviewedAt || '')}
                                    </span>
                                </p>
                            </div>
                        )}

                        {selectedClaim.status === 'pending' && (
                            <div className="pt-2 border-t">
                                <label className="block text-sm font-medium text-slate-600 mb-1">Catatan (Opsional)</label>
                                <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={3} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Tambahkan catatan untuk pelanggan..."></textarea>
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button variant="danger" onClick={() => handleReview('rejected')}><ThumbsDown size={16}/> Tolak Klaim</Button>
                                    <Button variant="primary" className="bg-green-600 hover:bg-green-700" onClick={() => handleReview('approved')}><ThumbsUp size={16}/> Setujui Klaim</Button>
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
};