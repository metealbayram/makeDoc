import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer'; // Used for high-fidelity PDF rendering
import Event from '../models/Event.js';
import Document from '../models/Document.js';


export const createDocument = async (req, res, next) => {
    try {
        const { title, content, name } = req.body;

        if(!title || !content || !name) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const pdfDir = path.join(process.cwd(), 'pdfs');
        if (!fs.existsSync(pdfDir)){
             fs.mkdirSync(pdfDir);
        }

        const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `${Date.now()}-${safeTitle}.pdf`;
        const filePath = path.join(pdfDir, fileName);

        // Wrap content in a full HTML structure with fonts and styles
        const fullHtml = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <title>${title}</title>
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,700;1,400&display=swap" rel="stylesheet">
                    <style>
                        body {
                            font-family: 'Roboto', Arial, sans-serif;
                            font-size: 11pt;
                            line-height: 1.3;
                            color: #000;
                            margin: 0;
                            padding: 0; /* Removing internal padding to let PDF margins handle whitespace */
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                        }
                        td, th {
                            border-color: #000 !important; /* Force black borders for PDF */
                        }
                        /* Ensure background colors print */
                        * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                    </style>
                </head>
                <body>
                    ${content}
                </body>
            </html>
        `;

        try {
            const browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox'] // Safer for various envs
            });
            const page = await browser.newPage();
            
            // Set content and wait for network to be idle (fonts loaded)
            await page.setContent(fullHtml, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });

            await page.pdf({
                path: filePath,
                format: 'A4',
                printBackground: true,
                scale: 0.90, // Slightly shrink to ensure single-page fit
                margin: {
                    top: '15mm',
                    right: '15mm',
                    bottom: '10mm', // Tighter bottom margin
                    left: '15mm'
                }
            });

            await browser.close();

        } catch (pdfError) {
            console.error("Puppeteer PDF Generation Error:", pdfError);
            return res.status(500).json({ 
                message: 'Error generating PDF with Puppeteer', 
                details: pdfError.message 
            });
        }

        const newDocument = await Document.create({
            title,
            content,
            name,
            path: filePath,
            user: req.lawyer._id
        });

        // Automatically create an event for this document
        await Event.create({
            title: `Document: ${title}`,
            date: new Date(),
            type: 'document',
            user: req.lawyer._id,
            documentId: newDocument._id
        });

        res.status(201).json({
            success: true,
            message: 'PDF created successfully',
            data: newDocument
        });

    } catch (error) {
        next(error);
    }
};

export const getDocuments = async (req, res, next) => {
    try {
        const { search } = req.query;
        let query = { user: req.lawyer._id };

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } }
            ];
        }

        const documents = await Document.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: documents
        });
    } catch (error) {
        next(error);
    }
};

export const downloadDocument = async (req, res, next) => {
    try {
        const { id } = req.params;
        const document = await Document.findOne({ _id: id, user: req.lawyer._id });

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const filePath = document.path;
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found on server' });
        }

        res.download(filePath); 
    } catch (error) {
        next(error);
    }
};

export const deleteDocument = async (req, res, next) => {
    try {
        const { id } = req.params;
        const document = await Document.findOne({ _id: id, user: req.lawyer._id });

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Delete the file from the filesystem if it exists
        if (document.path && fs.existsSync(document.path)) {
            try {
                fs.unlinkSync(document.path);
            } catch (err) {
                console.error("Error deleting file:", err);
                // Continue to delete from DB even if file deletion fails
            }
        }

        await Document.deleteOne({ _id: id });

        res.status(200).json({
            success: true,
            message: 'Document deleted successfully'
        });

    } catch (error) {
        next(error);
    }
};

export const updateDocumentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['Draft', 'Approved'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const document = await Document.findOne({ _id: id, user: req.lawyer._id });

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        document.status = status;
        await document.save();

        res.status(200).json({
            success: true,
            message: 'Document status updated successfully',
            data: document
        });

    } catch (error) {
        next(error);
    }
};

export const getDocumentById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const document = await Document.findOne({ _id: id, user: req.lawyer._id });

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        res.status(200).json({
            success: true,
            data: document
        });
    } catch (error) {
        next(error);
    }
};

export const updateDocument = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, content, name } = req.body;

        const document = await Document.findOne({ _id: id, user: req.lawyer._id });

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        if(!title || !content || !name) {
             return res.status(400).json({ message: 'Missing required fields' });
        }
        
        // Regenerate PDF
        const pdfDir = path.join(process.cwd(), 'pdfs');
        if (!fs.existsSync(pdfDir)){
             fs.mkdirSync(pdfDir);
        }

        const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `${Date.now()}-${safeTitle}.pdf`;
        const filePath = path.join(pdfDir, fileName);

        const fullHtml = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <title>${title}</title>
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,700;1,400&display=swap" rel="stylesheet">
                    <style>
                        body {
                            font-family: 'Roboto', Arial, sans-serif;
                            font-size: 11pt;
                            line-height: 1.3;
                            color: #000;
                            margin: 0;
                            padding: 0;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                        }
                        td, th {
                            border-color: #000 !important;
                        }
                        * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                    </style>
                </head>
                <body>
                    ${content}
                </body>
            </html>
        `;

         try {
            const browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            
            await page.setContent(fullHtml, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });

            await page.pdf({
                path: filePath,
                format: 'A4',
                printBackground: true,
                scale: 0.90,
                margin: {
                    top: '15mm',
                    right: '15mm',
                    bottom: '10mm',
                    left: '15mm'
                }
            });

            await browser.close();

            if (document.path && fs.existsSync(document.path)) {
                try {
                     fs.unlinkSync(document.path);
                } catch(e) {
                    console.error("Failed to delete old pdf:", e);
                }
            }

        } catch (pdfError) {
            console.error("Puppeteer PDF Generation Error:", pdfError);
            return res.status(500).json({ 
                message: 'Error generating PDF with Puppeteer', 
                details: pdfError.message 
            });
        }

        document.title = title;
        document.content = content;
        document.name = name;
        document.path = filePath;
        
        await document.save();

        res.status(200).json({
            success: true,
            message: 'Document updated successfully',
            data: document
        });

    } catch (error) {
        next(error);
    }
};




