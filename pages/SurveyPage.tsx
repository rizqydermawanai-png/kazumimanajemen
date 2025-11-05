// pages/SurveyPage.tsx
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { ChartComponent } from '../components/Chart';
import { Button } from '../components/ui/Button';
import { SurveyQuestion } from '../types';
import { Star, Smile, Meh, Frown, Users, Plus, Edit, Trash2 } from 'lucide-react';
import { QuestionManagementModal } from '../components/QuestionManagementModal';
import { useToast } from '../hooks/useToast';
import { useAppContext } from '../context/AppContext';

const StatCard = ({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) => (
     <div className="bg-white p-5 rounded-xl shadow-lg flex items-center space-x-4 border border-slate-200/50">
        <div className={`p-3 rounded-full ${color}`}>{icon}</div>
        <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

export const SurveyPage = () => {
    const { state, dispatch } = useAppContext();
    const { surveyResponses, users, surveyQuestions, currentUser } = state;

    const { addToast } = useToast();
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | null>(null);

    const handleEditQuestion = (question: SurveyQuestion) => {
        setEditingQuestion(question);
        setIsQuestionModalOpen(true);
    };

    const handleAddNewQuestion = () => {
        setEditingQuestion(null);
        setIsQuestionModalOpen(true);
    };

    const handleDeleteQuestion = (questionId: string) => {
        const questionText = surveyQuestions.find(q => q.id === questionId)?.text || 'N/A';
        if (window.confirm(`Anda yakin ingin menghapus pertanyaan ini?\n"${questionText}"`)) {
            dispatch({ type: 'SET_SURVEY_QUESTIONS', payload: surveyQuestions.filter(q => q.id !== questionId) });
            dispatch({ type: 'ADD_ACTIVITY', payload: { type: 'Survei', description: `Menghapus pertanyaan survei: "${questionText}"`} });
            addToast({ title: 'Pertanyaan Dihapus', type: 'success' });
        }
    };

    const handleSaveQuestion = (question: SurveyQuestion) => {
        const isEditing = !!editingQuestion;
        const newQuestions = isEditing 
            ? surveyQuestions.map(q => q.id === question.id ? question : q)
            : [...surveyQuestions, question];
            
        dispatch({ type: 'SET_SURVEY_QUESTIONS', payload: newQuestions });
        dispatch({ type: 'ADD_ACTIVITY', payload: { type: 'Survei', description: `${isEditing ? 'Mengedit' : 'Menambah'} pertanyaan survei: "${question.text}"`} });
        addToast({ title: 'Sukses', message: 'Daftar pertanyaan survei telah diperbarui.', type: 'success' });
        setIsQuestionModalOpen(false);
    };
    
    const surveyData = useMemo(() => {
        if (surveyResponses.length === 0) {
            return {
                totalRespondents: 0,
                totalStaff: 0,
                participationRate: 0,
                averageSatisfaction: 0,
                questionAverages: {},
                satisfactionDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            };
        }
        
        const totalStaff = users.filter(u => u.role === 'member' || u.role === 'admin').length;
        const respondentIds = new Set(surveyResponses.map(r => r.userId));
        const totalRespondents = respondentIds.size;
        const participationRate = totalStaff > 0 ? (totalRespondents / totalStaff) * 100 : 0;

        let totalSatisfactionSum = 0;
        let satisfactionResponseCount = 0;
        const questionSums: { [key: string]: number } = {};
        const questionCounts: { [key: string]: number } = {};
        const satisfactionDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        surveyResponses.forEach(response => {
            response.answers.forEach(answer => {
                questionSums[answer.questionId] = (questionSums[answer.questionId] || 0) + answer.answer;
                questionCounts[answer.questionId] = (questionCounts[answer.questionId] || 0) + 1;
                
                if (answer.questionId === surveyQuestions[0]?.id) {
                    totalSatisfactionSum += answer.answer;
                    satisfactionDistribution[answer.answer]++;
                    satisfactionResponseCount++;
                }
            });
        });
        
        const averageSatisfaction = satisfactionResponseCount > 0 ? totalSatisfactionSum / satisfactionResponseCount : 0;
        const questionAverages = Object.fromEntries(
            Object.keys(questionSums).map(qid => [qid, questionSums[qid] / questionCounts[qid]])
        );

        return {
            totalRespondents,
            totalStaff,
            participationRate,
            averageSatisfaction,
            questionAverages,
            satisfactionDistribution
        };

    }, [surveyResponses, users, surveyQuestions]);
    
    const satisfactionChartData = {
        labels: ['1 - Sangat Buruk', '2 - Buruk', '3 - Cukup', '4 - Baik', '5 - Sangat Baik'],
        datasets: [{
            label: 'Jumlah Responden',
            data: Object.values(surveyData.satisfactionDistribution),
            backgroundColor: ['#ef4444', '#f97316', '#facc15', '#84cc16', '#22c55e'],
        }]
    };
    
    const questionAveragesChartData = {
        labels: surveyQuestions.map(q => q.text),
        datasets: [{
            label: 'Rata-rata Skor (dari 5)',
            data: surveyQuestions.map(q => surveyData.questionAverages[q.id] || 0),
            backgroundColor: 'rgba(79, 70, 229, 0.6)',
            borderColor: 'rgba(79, 70, 229, 1)',
            borderWidth: 1,
        }]
    };

    const getSatisfactionEmoji = (score: number) => {
        if (score >= 4) return <Smile className="text-green-500" />;
        if (score >= 2.5) return <Meh className="text-yellow-500" />;
        return <Frown className="text-red-500" />;
    };
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Hasil Survei Kepuasan Pegawai</h1>
            <p className="text-slate-600">Ringkasan anonim dari survei kepuasan yang diadakan secara periodik untuk memantau kesejahteraan tim.</p>

            <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { staggerChildren: 0.1 } }}
            >
                <StatCard title="Tingkat Partisipasi" value={`${surveyData.participationRate.toFixed(1)}%`} icon={<Users size={24} className="text-white"/>} color="bg-blue-500" />
                <StatCard title="Total Responden" value={`${surveyData.totalRespondents}`} icon={<Users size={24} className="text-white"/>} color="bg-blue-500" />
                <StatCard title="Kepuasan Rata-rata" value={`${surveyData.averageSatisfaction.toFixed(2)} / 5`} icon={<Star size={24} className="text-white"/>} color="bg-yellow-500" />
                <StatCard title="Sentimen Umum" value="" icon={getSatisfactionEmoji(surveyData.averageSatisfaction)} color="bg-slate-200" />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card>
                     <h2 className="text-xl font-bold text-slate-700 mb-4">Distribusi Kepuasan Keseluruhan</h2>
                     <div className="h-80">
                         <ChartComponent type="doughnut" data={satisfactionChartData} />
                     </div>
                </Card>
                <Card>
                     <h2 className="text-xl font-bold text-slate-700 mb-4">Skor Rata-rata per Pertanyaan</h2>
                     <div className="h-80">
                         <ChartComponent type="bar" data={questionAveragesChartData} options={{ indexAxis: 'y', scales: { x: { beginAtZero: true, max: 5 } } }} />
                     </div>
                </Card>
            </div>

            {currentUser?.role === 'super_admin' && (
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-700">Manajemen Pertanyaan Survei</h2>
                        <Button onClick={handleAddNewQuestion}><Plus size={16}/> Tambah Pertanyaan</Button>
                    </div>
                     <div className="border rounded-lg overflow-hidden">
                        <div className="flex items-center bg-slate-50 p-3 font-semibold text-sm text-slate-600">
                            <div className="w-10 text-center">No.</div>
                            <div className="flex-grow">Pertanyaan</div>
                            <div className="w-24 text-center">Aksi</div>
                        </div>
                        <div className="divide-y divide-slate-200">
                            {surveyQuestions.length > 0 ? surveyQuestions.map((q, index) => (
                                <div key={q.id} className="flex items-center p-3 hover:bg-slate-50/50 transition-colors">
                                    <div className="w-10 text-center text-slate-500">{index + 1}</div>
                                    <p className="flex-grow text-sm text-slate-800">{q.text}</p>
                                    <div className="w-24 flex justify-center gap-2">
                                        <Button variant="ghost" size="sm" className="!p-2" onClick={() => handleEditQuestion(q)}><Edit size={16} /></Button>
                                        <Button variant="ghost" size="sm" className="!p-2 text-slate-400 hover:text-red-500 hover:bg-red-50" onClick={() => handleDeleteQuestion(q.id)}><Trash2 size={16} /></Button>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-slate-500">
                                    <p>Belum ada pertanyaan survei.</p>
                                    <p className="text-sm">Klik "Tambah Pertanyaan" untuk memulai.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            )}

            <QuestionManagementModal
                isOpen={isQuestionModalOpen}
                onClose={() => setIsQuestionModalOpen(false)}
                onSave={handleSaveQuestion}
                question={editingQuestion}
            />
        </div>
    );
};
