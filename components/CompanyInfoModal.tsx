// components/CompanyInfoModal.tsx
import React from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import type { CompanyInfo } from '../types';
import { MapPin, Phone, Mail } from 'lucide-react';

interface CompanyInfoModalProps {
    onClose: () => void;
    companyInfo: CompanyInfo;
}

export const CompanyInfoModal = ({ onClose, companyInfo }: CompanyInfoModalProps) => {
    return (
        <Modal isOpen={true} onClose={onClose} title={companyInfo.name}>
            <div className="space-y-4">
                <div>
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2 mb-1"><MapPin size={16} /> Alamat</h3>
                    <p className="text-slate-600 pl-8">{companyInfo.address}</p>
                </div>
                <div>
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2 mb-1"><Phone size={16} /> Telepon</h3>
                    <p className="text-slate-600 pl-8">{companyInfo.phone}</p>
                </div>
                <div>
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2 mb-1"><Mail size={16} /> Email</h3>
                    <p className="text-slate-600 pl-8">{companyInfo.email}</p>
                </div>
                <div className="aspect-[16/9] rounded-lg overflow-hidden border mt-4">
                    <iframe
                        src={companyInfo.googleMapsEmbedUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen={false}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Peta Lokasi Perusahaan"
                    ></iframe>
                </div>
            </div>
            <div className="flex justify-end mt-6">
                <Button variant="secondary" onClick={onClose}>Tutup</Button>
            </div>
        </Modal>
    );
};
