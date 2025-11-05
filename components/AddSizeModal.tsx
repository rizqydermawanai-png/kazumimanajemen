// components/AddSizeModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { CustomInput } from './ui/CustomInput';
import { useToast } from '../hooks/useToast';

interface AddSizeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { sizeName: string; measurements: { [key: string]: number } }) => void;
    parameters: string[];
    existingSizes: string[];
}

export const AddSizeModal = ({ isOpen, onClose, onSave, parameters, existingSizes }: AddSizeModalProps) => {
    const [sizeName, setSizeName] = useState('');
    const [measurements, setMeasurements] = useState<{ [key: string]: number }>({});
    const { addToast } = useToast();

    useEffect(() => {
        // Reset state when modal is opened
        if (isOpen) {
            setSizeName('');
            const initialMeasurements: { [key: string]: number } = {};
            parameters.forEach(param => {
                initialMeasurements[param] = 0;
            });
            setMeasurements(initialMeasurements);
        }
    }, [isOpen, parameters]);

    const handleMeasurementChange = (param: string, value: string) => {
        setMeasurements(prev => ({
            ...prev,
            [param]: parseFloat(value) || 0,
        }));
    };

    const handleSaveClick = () => {
        const trimmedSizeName = sizeName.trim().toUpperCase();
        if (!trimmedSizeName) {
            addToast({ title: 'Error', message: 'Nama ukuran tidak boleh kosong.', type: 'error' });
            return;
        }
        if (existingSizes.map(s => s.toUpperCase()).includes(trimmedSizeName)) {
            addToast({ title: 'Error', message: `Ukuran "${trimmedSizeName}" sudah ada.`, type: 'error' });
            return;
        }
        
        onSave({ sizeName: trimmedSizeName, measurements });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Tambah Ukuran Baru">
            <div className="space-y-4">
                <CustomInput
                    label="Nama Ukuran"
                    value={sizeName}
                    onChange={e => setSizeName(e.target.value)}
                    placeholder="Contoh: XXXL, All Size"
                    required
                />
                
                <div className="pt-2 border-t">
                    <h4 className="font-semibold text-slate-700 mb-2">Parameter Pengukuran (cm)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {parameters.map(param => (
                            <CustomInput
                                key={param}
                                label={param}
                                type="number"
                                value={measurements[param] || ''}
                                onChange={e => handleMeasurementChange(param, e.target.value)}
                                placeholder="0"
                            />
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="secondary" onClick={onClose}>Batal</Button>
                    <Button onClick={handleSaveClick}>Simpan Ukuran</Button>
                </div>
            </div>
        </Modal>
    );
};
