// components/PrintProvider.tsx
import React, { useState, useCallback, createContext, useContext } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Printer, X } from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface PrintContextType {
    showPrintPreview: (content: string, title: string) => void;
}

const PrintContext = createContext<PrintContextType | undefined>(undefined);

export const usePrintPreview = () => {
    const context = useContext(PrintContext);
    if (!context) throw new Error('usePrintPreview must be used within a PrintProvider');
    return context;
};

const PrintPreviewModal = ({ isOpen, onClose, title, content }: { isOpen: boolean; onClose: () => void; title: string; content: string; }) => {
    const [isPrinting, setIsPrinting] = useState(false);
    const { addToast } = useToast();

    const handlePrintClick = () => {
        if (isPrinting) return;
        setIsPrinting(true);

        const printWindow = window.open('', '_blank');

        if (!printWindow) {
            addToast({
                title: 'Pop-up Diblokir',
                message: 'Browser Anda mungkin memblokir pop-up. Izinkan pop-up untuk situs ini agar dapat mencetak.',
                type: 'error',
                duration: 6000
            });
            setIsPrinting(false);
            return;
        }

        const linkedStylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        const tailwindScript = `<script src="https://cdn.tailwindcss.com"></script>`;

        const htmlToPrint = `
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <title>${title}</title>
                <meta charset="UTF-8" />
                ${linkedStylesheets.map(el => el.outerHTML).join('\n')}
                ${tailwindScript}
                <style>
                    @media print {
                        @page { 
                            size: A4;
                            margin: 1cm;
                        }
                        html, body {
                            width: 210mm;
                            height: 297mm;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                    }
                    body {
                      font-family: 'Inter', sans-serif;
                      background-color: #fff;
                    }
                </style>
            </head>
            <body>
                ${content}
            </body>
            </html>
        `;
        
        printWindow.document.write(htmlToPrint);
        printWindow.document.close();

        setTimeout(() => {
            try {
                printWindow.focus();
                printWindow.print();
            } catch (e) {
                console.error("Print call failed:", e);
                addToast({ title: 'Error Cetak', message: 'Gagal memanggil fungsi cetak browser.', type: 'error' });
            } finally {
                if (!printWindow.closed) {
                    printWindow.close();
                }
                setIsPrinting(false);
            }
        }, 1000);
    };


    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: -20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 20, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col h-[95vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        <header className="flex justify-between items-center p-4 border-b bg-white rounded-t-xl flex-shrink-0">
                            <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePrintClick}
                                    disabled={isPrinting}
                                    className="inline-flex items-center justify-center rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 gap-2 bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm hover:shadow-md shadow-indigo-500/20 px-3 py-1.5 text-sm disabled:opacity-50"
                                >
                                    <Printer size={16}/> {isPrinting ? 'Mencetak...' : 'Cetak'}
                                </button>
                                <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </header>
                        <main className="p-2 sm:p-4 overflow-y-auto flex-grow">
                            <div id="printable-content-preview" className="bg-white shadow-lg max-w-[210mm] mx-auto" dangerouslySetInnerHTML={{ __html: content }} />
                        </main>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// FIX: Changed the props type to `{ children: React.ReactNode }` to explicitly require the children prop, resolving a TypeScript error in App.tsx.
export const PrintProvider = ({ children }: { children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [printContent, setPrintContent] = useState('');
    const [printTitle, setPrintTitle] = useState('');

    const showPrintPreview = useCallback((content: string, title: string) => {
        setPrintContent(content);
        setPrintTitle(title);
        setIsOpen(true);
    }, []);

    const hidePrintPreview = useCallback(() => setIsOpen(false), []);

    return (
        <PrintContext.Provider value={{ showPrintPreview }}>
            {children}
            <PrintPreviewModal isOpen={isOpen} onClose={hidePrintPreview} title={printTitle} content={printContent} />
        </PrintContext.Provider>
    );
};
