// components/AddModelModal.tsx
import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { CustomInput } from './ui/CustomInput';
import { CustomSelect } from './ui/CustomSelect';
import { GarmentPattern } from '../types';

interface AddModelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { garmentKey: string; modelName: string }) => void;
    garmentPatterns: { [key: string]: GarmentPattern };
}

export const AddModelModal = ({ isOpen, onClose, onSave, garmentPatterns }: AddModelModalProps) => {
    const [garmentKey, setGarmentKey] = useState(Object.keys(garmentPatterns)[0] || '');
    const [modelName, setModelName] = useState('');

    const handleSave = () => {
        onSave({ garmentKey, modelName });
        setModelName(''); // Reset for next use
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Tambah Model Baru">
            <div className="space-y-4">
                <CustomSelect label="Pilih Tipe Pakaian Dasar" value={garmentKey} onChange={e => setGarmentKey(e.target.value)}>
                    {Object.entries(garmentPatterns).map(([key, value]) => (
                        <option key={key} value={key}>{value.title}</option>
                    ))}
                </CustomSelect>
                <CustomInput label="Nama Model Baru" value={modelName} onChange={e => setModelName(e.target.value)} placeholder="Contoh: V-Neck, Slim Fit" />
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="secondary" onClick={onClose}>Batal</Button>
                    <Button onClick={handleSave} disabled={!garmentKey || !modelName.trim()}>Simpan Model</Button>
                </div>
            </div>
        </Modal>
    );
};