// pages/SizingStandardsPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Plus, Ruler, PlusCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CustomInput } from '../components/ui/CustomInput';
import { useToast } from '../hooks/useToast';
import type { AllSizingStandards, GarmentPattern, GarmentMeasurement } from '../types';
import { useAppContext } from '../context/AppContext';
import { AddModelModal } from '../components/AddModelModal';
import { AddSizeModal } from '../components/AddSizeModal';

export const SizingStandardsPage = () => {
    const { state, dispatch } = useAppContext();
    const { sizingStandards, garmentPatterns } = state;

    const garmentModelTabs = useMemo(() => Object.entries(garmentPatterns).flatMap(([garmentKey, garmentInfo]) => {
        // FIX: Cast garmentInfo to GarmentPattern to resolve property access errors.
        const info = garmentInfo as GarmentPattern;
        if (info.models && info.models.length > 0) {
            return info.models.map(model => ({
                key: `${garmentKey}-${model.replace(/\s+/g, '-')}`,
                label: `${info.title} - ${model}`
            }));
        }
        return [{ key: garmentKey, label: info.title }];
    }), [garmentPatterns]);

    const [activeTab, setActiveTab] = useState<string>(garmentModelTabs[0]?.key || '');
    const [localStandards, setLocalStandards] = useState<AllSizingStandards>(sizingStandards);
    const [isAddModelModalOpen, setIsAddModelModalOpen] = useState(false);
    const [isAddSizeModalOpen, setIsAddSizeModalOpen] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        setLocalStandards(sizingStandards);
    }, [sizingStandards]);

     // Ensure activeTab is valid when tabs change
    useEffect(() => {
        if (!garmentModelTabs.some(tab => tab.key === activeTab)) {
            setActiveTab(garmentModelTabs[0]?.key || '');
        }
    }, [garmentModelTabs, activeTab]);


    const handleInputChange = (size: string, param: string, value: string) => {
        const numericValue = parseFloat(value) || 0;
        const updatedTabStandards = { ...(localStandards[activeTab] || {}) };
        if (!updatedTabStandards[size]) {
            updatedTabStandards[size] = {};
        }
        updatedTabStandards[size][param] = numericValue;
        setLocalStandards({ ...localStandards, [activeTab]: updatedTabStandards });
    };

    const handleSaveChanges = () => {
        dispatch({ type: 'SET_SIZING_STANDARDS', payload: localStandards });
        const currentTabLabel = garmentModelTabs.find(t => t.key === activeTab)?.label || activeTab;
        dispatch({ type: 'ADD_ACTIVITY', payload: { type: 'Pengaturan', description: `Memperbarui standar ukuran untuk ${currentTabLabel}` } });
        addToast({ title: 'Sukses', message: `Standar ukuran untuk ${currentTabLabel} telah disimpan.`, type: 'success' });
    };

    const handleSaveNewSize = ({ sizeName, measurements }: { sizeName: string; measurements: GarmentMeasurement }) => {
        const currentTabStandards = localStandards[activeTab] || {};
        const updatedTabStandards = { ...currentTabStandards, [sizeName]: measurements };
        setLocalStandards({ ...localStandards, [activeTab]: updatedTabStandards });
        addToast({ title: 'Ukuran Ditambahkan', message: `Ukuran baru "${sizeName}" telah ditambahkan. Jangan lupa simpan perubahan.`, type: 'success' });
        setIsAddSizeModalOpen(false);
    };
    
    const handleSaveNewModel = ({ garmentKey, modelName }: { garmentKey: string; modelName: string }) => {
        const cleanModelName = modelName.trim();
        if (!cleanModelName) {
            addToast({ title: 'Error', message: 'Nama model tidak boleh kosong.', type: 'error' });
            return;
        }
    
        const garmentToUpdate = { ...garmentPatterns[garmentKey] };
        if (garmentToUpdate.models.includes(cleanModelName)) {
            addToast({ title: 'Error', message: `Model "${cleanModelName}" sudah ada untuk tipe ${garmentToUpdate.title}.`, type: 'error' });
            return;
        }
    
        // 1. Update Garment Patterns
        garmentToUpdate.models = [...garmentToUpdate.models, cleanModelName];
        const newGarmentPatterns = { ...garmentPatterns, [garmentKey]: garmentToUpdate };
        dispatch({ type: 'SET_GARMENT_PATTERNS', payload: newGarmentPatterns });
    
        // 2. Update Sizing Standards
        // Find a base standard to copy from the same garment type
        const baseModelKey = Object.keys(sizingStandards).find(key => key.startsWith(garmentKey));
        const baseStandard = baseModelKey ? sizingStandards[baseModelKey] : {};

        const newModelKey = `${garmentKey}-${cleanModelName.replace(/\s+/g, '-')}`;
        
        const newSizingStandards = { ...sizingStandards, [newModelKey]: JSON.parse(JSON.stringify(baseStandard)) };
        dispatch({ type: 'SET_SIZING_STANDARDS', payload: newSizingStandards });
    
        // 3. Log and toast
        dispatch({ type: 'ADD_ACTIVITY', payload: {type: 'Pengaturan', description: `Menambah model baru "${cleanModelName}" untuk ${garmentToUpdate.title}`} });
        addToast({ title: 'Sukses', message: 'Model baru berhasil ditambahkan.', type: 'success' });
    
        // 4. Close modal and set active tab
        setIsAddModelModalOpen(false);
        setActiveTab(newModelKey);
    };

    const currentGarmentSizes = localStandards[activeTab] || {};
    const sizes = Object.keys(currentGarmentSizes);
    const currentTabLabel = garmentModelTabs.find(t => t.key === activeTab)?.label || 'Pilih Tipe';

    // Logic to determine parameters for the new size modal
    const parametersForNewSize = useMemo(() => {
        const currentTabStandards = localStandards[activeTab] || {};
        const existingSizes = Object.keys(currentTabStandards);
        const firstSizeWithData = existingSizes.find(s =>
            currentTabStandards[s] && Object.keys(currentTabStandards[s]).length > 0
        );
        if (firstSizeWithData) {
            return Object.keys(currentTabStandards[firstSizeWithData]);
        }
        // Fallback logic
        const garmentType = activeTab.split('-')[0];
        switch (garmentType) {
            case 'kaos':
            case 'kemeja':
            case 'jaket':
                return ['Lebar Dada', 'Panjang Badan', 'Panjang Lengan'];
            case 'celana':
                return ['Lingkar Pinggang', 'Panjang Celana', 'Lebar Paha'];
            default:
                return ['Lebar', 'Panjang'];
        }
    }, [activeTab, localStandards]);

    const parametersForTable = sizes.length > 0 ? Object.keys(currentGarmentSizes[sizes[0]]) : parametersForNewSize;


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Standard Ukuran Pakaian</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Navigation Sidebar */}
                <div className="md:col-span-1">
                    <Card className="p-4">
                        <div className="flex justify-between items-center mb-3 px-2">
                             <h2 className="text-lg font-bold text-slate-700">Tipe Pakaian</h2>
                             <Button variant="ghost" size="sm" className="!p-2" onClick={() => setIsAddModelModalOpen(true)} title="Tambah Model Baru">
                                <PlusCircle size={20}/>
                            </Button>
                        </div>
                        <nav className="space-y-1 max-h-[60vh] overflow-y-auto">
                            {garmentModelTabs.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`w-full text-left px-3 py-2.5 font-semibold text-sm rounded-lg transition-colors ${
                                        activeTab === tab.key 
                                            ? 'bg-indigo-100 text-indigo-700' 
                                            : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </Card>
                </div>

                {/* Content Area */}
                <div className="md:col-span-3">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card className="p-0 overflow-hidden">
                                <div className="p-4 border-b flex justify-between items-center flex-wrap gap-2">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                            <Ruler className="text-indigo-600" />
                                            Detail Ukuran: {currentTabLabel}
                                        </h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setIsAddSizeModalOpen(true)}><Plus size={16}/> Tambah Ukuran</Button>
                                        <Button size="sm" onClick={handleSaveChanges}><Save size={16}/> Simpan Perubahan</Button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[600px] text-sm text-left">
                                            <thead className="bg-slate-50">
                                                <tr className="text-slate-600">
                                                    <th className="p-3 font-semibold rounded-tl-lg">Ukuran</th>
                                                    {parametersForTable.map(param => (
                                                        <th key={param} className="p-3 font-semibold text-center">{param} (cm)</th>
                                                    ))}
                                                     <th className="rounded-tr-lg"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sizes.map(size => (
                                                    <tr key={size} className="border-b last:border-0 hover:bg-slate-50/50">
                                                        <td className="p-2 font-semibold text-slate-700">{size}</td>
                                                        {parametersForTable.map(param => (
                                                            <td key={param} className="p-2 w-36">
                                                                <CustomInput
                                                                    type="number"
                                                                    className="text-center !py-1.5"
                                                                    value={localStandards[activeTab]?.[size]?.[param] || ''}
                                                                    onChange={(e) => handleInputChange(size, param, e.target.value)}
                                                                />
                                                            </td>
                                                        ))}
                                                        <td></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                         {sizes.length === 0 && (
                                            <div className="text-center py-12 text-slate-500">
                                                <p>Belum ada ukuran untuk tipe ini.</p>
                                                <p className="text-xs">Klik "Tambah Ukuran" untuk memulai.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <AddModelModal 
                isOpen={isAddModelModalOpen}
                onClose={() => setIsAddModelModalOpen(false)}
                onSave={handleSaveNewModel}
                garmentPatterns={garmentPatterns}
            />
            
            <AddSizeModal
                isOpen={isAddSizeModalOpen}
                onClose={() => setIsAddSizeModalOpen(false)}
                onSave={handleSaveNewSize}
                parameters={parametersForNewSize}
                existingSizes={sizes}
            />
        </div>
    );
};