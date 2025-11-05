// components/SurveyFormModal.tsx
import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Star } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import type { SurveyAnswer, SurveyQuestion } from '../types';

interface SurveyFormModalProps {
    onClose: () => void;
    onSubmit: (answers: SurveyAnswer[]) => void;
    surveyQuestions: SurveyQuestion[];
}

const ratingLabels = ['Sangat Buruk', 'Buruk', 'Cukup', 'Baik', 'Sangat Baik'];

export const SurveyFormModal = ({ onClose, onSubmit, surveyQuestions }: SurveyFormModalProps) => {
    const [answers, setAnswers] = useState<{ [key: string]: number }>({});
    const [hoveredRatings, setHoveredRatings] = useState<{ [key: string]: number }>({});
    const { addToast } = useToast();

    const handleRating = (questionId: string, rating: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: rating }));
    };

    const handleSubmit = () => {
        if (Object.keys(answers).length < surveyQuestions.length) {
            addToast({ title: 'Belum Selesai', message: 'Harap jawab semua pertanyaan sebelum mengirim.', type: 'warning' });
            return;
        }

        const formattedAnswers: SurveyAnswer[] = surveyQuestions.map(q => ({
            questionId: q.id,
            questionText: q.text,
            answer: answers[q.id],
        }));

        onSubmit(formattedAnswers);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Survei Kepuasan Pegawai">
            <div className="space-y-6">
                <p className="text-sm text-slate-600">Kami menghargai waktu Anda untuk memberikan umpan balik. Jawaban Anda akan membantu kami menjadi tempat kerja yang lebih baik. Survei ini bersifat rahasia.</p>
                
                {surveyQuestions.map(question => (
                    <div key={question.id}>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{question.text}</label>
                        <div 
                            className="flex items-center space-x-1"
                            onMouseLeave={() => setHoveredRatings(prev => ({ ...prev, [question.id]: 0 }))}
                        >
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    type="button"
                                    key={star}
                                    onClick={() => handleRating(question.id, star)}
                                    onMouseEnter={() => setHoveredRatings(prev => ({ ...prev, [question.id]: star }))}
                                    className="focus:outline-none"
                                >
                                    <Star 
                                        className={`w-7 h-7 transition-colors duration-150 ${
                                            (hoveredRatings[question.id] || answers[question.id] || 0) >= star 
                                                ? 'text-yellow-400 fill-current' 
                                                : 'text-slate-300'
                                        }`} 
                                    />
                                </button>
                            ))}
                             <span className="ml-3 text-sm text-slate-500 font-semibold w-28">
                                {ratingLabels[(hoveredRatings[question.id] || answers[question.id] || 1) - 1]}
                            </span>
                        </div>
                    </div>
                ))}

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="secondary" onClick={onClose}>Tutup</Button>
                    <Button onClick={handleSubmit}>Kirim Survei</Button>
                </div>
            </div>
        </Modal>
    );
};