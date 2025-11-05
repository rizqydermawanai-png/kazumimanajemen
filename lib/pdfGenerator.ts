// lib/pdfGenerator.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LOGO_URL } from './data';
import { formatDate } from './utils';

/**
 * Generates a professional-looking PDF report with a header, logo, and a data table.
 * @param title - The main title of the report.
 * @param headers - An array of arrays for table headers (e.g., [['ID', 'Name', 'Email']]).
 * @param data - An array of arrays containing the table body data.
 * @param filename - The desired filename for the downloaded PDF.
 */
export const generatePdfReport = (
    title: string,
    headers: string[][],
    data: (string | number)[][],
    filename: string
) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Add Header with Logo
    // Note: Using a direct URL might be blocked by CORS in some browsers. 
    // For production, it's better to convert the logo to a base64 string.
    try {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = LOGO_URL;
        
        // This is a workaround for jsPDF to handle images from URLs.
        // We can proceed without the image if it fails to load.
        if (img.complete) {
            doc.addImage(img, 'PNG', 15, 12, 40, 10);
        } else {
             img.onload = () => {
                doc.addImage(img, 'PNG', 15, 12, 40, 10);
             };
        }
    } catch (error) {
        console.error("Could not add logo to PDF:", error);
        doc.setFontSize(20);
        doc.text("KAZUMI", 15, 20);
    }
    
    // 2. Add Title and Subtitle
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text(title, pageWidth / 2, 22, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    const dateStr = `Dicetak pada: ${formatDate(new Date())}`;
    doc.text(dateStr, pageWidth / 2, 28, { align: 'center' });

    // 3. Add Table
    autoTable(doc, {
        head: headers,
        body: data,
        startY: 40, // Start table below the header
        theme: 'grid',
        headStyles: {
            fillColor: [79, 70, 229], // Indigo color for header
            textColor: 255,
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 8,
            cellPadding: 2,
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252] // Light slate color for alternate rows
        }
    });

    // 4. Save the PDF
    doc.save(filename);
};