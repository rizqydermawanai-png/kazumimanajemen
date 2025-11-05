// components/QuestionManagementModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useToast } from '../hooks/useToast';
import type { SurveyQuestion } from '../types';

interface QuestionManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (question: SurveyQuestion) => void;
    question: SurveyQuestion | null; // null for new, object for editing
}

export const QuestionManagementModal = ({ isOpen, onClose, onSave, question }: QuestionManagementModalProps) => {
    const [text, setText] = useState('');
    const { addToast } = useToast();

    useEffect(() => {
        if (isOpen) {
            setText(question?.text || '');
        }
    }, [isOpen, question]);

    const handleSave = () => {
        if (!text.trim()) {
            addToast({ title: 'Error', message: 'Teks pertanyaan tidak boleh kosong.', type: 'error' });
            return;
        }
        
        onSave({
            id: question?.id || crypto.randomUUID(),
            text: text.trim(),
        });
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={question ? 'Edit Pertanyaan Survei' : 'Tambah Pertanyaan Baru'}
        >
            <div className="space-y-4">
                <div>
                    <label htmlFor="question-text" className="block text-sm font-medium text-slate-700 mb-1">
                        Teks Pertanyaan
                    </label>
                    <textarea
                        id="question-text"
                        value={text}
                        onChange={e => setText(e.target.value)}
                        rows={4}
                        className="w-full p-2 border rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-slate-900"
                        placeholder="Tuliskan pertanyaan Anda di sini..."
                    />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="secondary" onClick={onClose}>Batal</Button>
                    <Button onClick={handleSave}>Simpan Pertanyaan</Button>
                </div>
            </div>
        </Modal>
    );
};