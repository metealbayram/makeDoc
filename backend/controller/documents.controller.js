import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import crypto from 'crypto';
import Event from '../models/Event.js';
import Document from '../models/Document.js';
import Lawyer from '../models/lawyer.js';
import { createNotification } from "../utils/createNotification.js";

const MARKER = '\n---SIGNATURE_DATA---\n';

const getUserDocumentRole = (document, lawyerId) => {
    if (!document || !lawyerId) return null;

    const ownerId = document.user?._id
        ? document.user._id.toString()
        : document.user?.toString?.();

    const currentLawyerId = lawyerId?.toString?.();

    if (ownerId === currentLawyerId) {
        return 'owner';
    }

    const sharedUser = document.sharedWith?.find((item) => {
        const sharedUserId = item.user?._id
            ? item.user._id.toString()
            : item.user?.toString?.();

        return sharedUserId === currentLawyerId;
    });

    return sharedUser ? sharedUser.role : null;
};

const canView = (role) => ['owner', 'editor', 'viewer'].includes(role);
const canEdit = (role) => ['owner', 'editor'].includes(role);
const isOwner = (role) => role === 'owner';

const generatePdfFromHtml = async ({ title, content, filePath }) => {
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

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
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
    } finally {
        await browser.close();
    }
};

const ensurePdfDirectory = () => {
    const pdfDir = path.join(process.cwd(), 'pdfs');

    if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir);
    }

    return pdfDir;
};

const buildPdfFilePath = (title) => {
    const pdfDir = ensurePdfDirectory();
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${Date.now()}-${safeTitle}.pdf`;
    return path.join(pdfDir, fileName);
};

const getAccessibleDocument = async (documentId, lawyerId, populate = false) => {
    let query = Document.findById(documentId);

    if (populate) {
        query = query
            .populate('user', 'name email')
            .populate('sharedWith.user', 'name email');
    }

    const document = await query;

    if (!document) return { document: null, role: null };

    const role = getUserDocumentRole(document, lawyerId);

    return { document, role };
};

export const createDocument = async (req, res, next) => {
    try {
        const { title, content, name } = req.body;

        if (!title || !content || !name) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const filePath = buildPdfFilePath(title);

        try {
            await generatePdfFromHtml({ title, content, filePath });
        } catch (pdfError) {
            console.error('Puppeteer PDF Generation Error:', pdfError);
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

        await Event.create({
            title: `Document: ${title}`,
            date: new Date(),
            type: 'document',
            user: req.lawyer._id,
            documentId: newDocument._id
        });

        const populatedDocument = await Document.findById(newDocument._id)
            .populate('user', 'name email')
            .populate('sharedWith.user', 'name email');

        res.status(201).json({
            success: true,
            message: 'PDF created successfully',
            data: populatedDocument
        });
    } catch (error) {
        next(error);
    }
};

export const getDocuments = async (req, res, next) => {
    try {
        const { search } = req.query;

        const query = {
            $or: [
                { user: req.lawyer._id },
                { 'sharedWith.user': req.lawyer._id }
            ]
        };

        if (search) {
            query.$and = [
                {
                    $or: [
                        { title: { $regex: search, $options: 'i' } },
                        { name: { $regex: search, $options: 'i' } }
                    ]
                }
            ];
        }

        const documents = await Document.find(query)
            .populate('user', 'name email')
            .populate('sharedWith.user', 'name email')
            .sort({ createdAt: -1 });

        const documentsWithRole = documents.map((doc) => ({
            ...doc.toObject(),
            role: getUserDocumentRole(doc, req.lawyer._id)
        }));

        res.status(200).json({
            success: true,
            data: documentsWithRole
        });
    } catch (error) {
        next(error);
    }
};

export const getDocumentById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { document, role } = await getAccessibleDocument(id, req.lawyer._id, true);

        console.log("----- getDocumentById DEBUG -----");
        console.log("requested document id:", id);
        console.log("req.lawyer._id:", req.lawyer?._id?.toString());
        console.log("document exists:", !!document);

        if (document) {
            console.log("document.user:", document.user?._id ? document.user._id.toString() : document.user?.toString?.());
            console.log("document.title:", document.title);
            console.log(
                "sharedWith:",
                (document.sharedWith || []).map((item) => ({
                    user: item.user?._id ? item.user._id.toString() : item.user?.toString?.(),
                    role: item.role
                }))
            );
        }

        console.log("resolved role:", role);
        console.log("--------------------------------");

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        if (!canView(role)) {
            return res.status(403).json({
                message: 'You do not have permission to view this document',
                debug: {
                    requestedBy: req.lawyer?._id?.toString(),
                    resolvedRole: role
                }
            });
        }

        res.status(200).json({
            success: true,
            role,
            data: document
        });
    } catch (error) {
        console.error("getDocumentById error:", error);
        next(error);
    }
};

export const downloadDocument = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { document, role } = await getAccessibleDocument(id, req.lawyer._id);

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        if (!canView(role)) {
            return res.status(403).json({ message: 'You do not have permission to download this document' });
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

        const { document, role } = await getAccessibleDocument(id, req.lawyer._id);

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        if (!isOwner(role)) {
            return res.status(403).json({ message: 'Only the owner can delete this document' });
        }

        if (document.path && fs.existsSync(document.path)) {
            try {
                fs.unlinkSync(document.path);
            } catch (err) {
                console.error('Error deleting file:', err);
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

        const { document, role } = await getAccessibleDocument(id, req.lawyer._id);

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        if (!isOwner(role)) {
            return res.status(403).json({ message: 'Only the owner can update document status' });
        }

        if (status === 'Approved' && document.status !== 'Approved') {
            if (document.path && fs.existsSync(document.path)) {
                try {
                    const pdfBuffer = fs.readFileSync(document.path);

                    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
                        modulusLength: 2048,
                        publicKeyEncoding: { type: 'spki', format: 'pem' },
                        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
                    });

                    const hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

                    const sign = crypto.createSign('SHA256');
                    sign.update(pdfBuffer);
                    sign.end();

                    const signature = sign.sign(privateKey, 'base64');
                    const timestamp = new Date().toISOString();

                    const embedData = {
                        signature,
                        publicKey,
                        originalHash: hash,
                        signerName: req.lawyer ? req.lawyer.name : document.name,
                        timestamp
                    };

                    const markerBuffer = Buffer.from(MARKER, 'utf-8');
                    const payloadBuffer = Buffer.from(JSON.stringify(embedData), 'utf-8');
                    const signedPdfBuffer = Buffer.concat([pdfBuffer, markerBuffer, payloadBuffer]);

                    fs.writeFileSync(document.path, signedPdfBuffer);
                } catch (signError) {
                    console.error('Error signing document on approval:', signError);
                    return res.status(500).json({
                        message: 'Failed to sign the document during approval.'
                    });
                }
            }
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

export const updateDocument = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, content, name } = req.body;

        const { document, role } = await getAccessibleDocument(id, req.lawyer._id);

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        if (!canEdit(role)) {
            return res.status(403).json({ message: 'You do not have permission to edit this document' });
        }

        if (!title || !content || !name) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const filePath = buildPdfFilePath(title);

        try {
            await generatePdfFromHtml({ title, content, filePath });

            if (document.path && fs.existsSync(document.path)) {
                try {
                    fs.unlinkSync(document.path);
                } catch (e) {
                    console.error('Failed to delete old pdf:', e);
                }
            }
        } catch (pdfError) {
            console.error('Puppeteer PDF Generation Error:', pdfError);
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

        const updatedDocument = await Document.findById(document._id)
            .populate('user', 'name email')
            .populate('sharedWith.user', 'name email');

        res.status(200).json({
            success: true,
            message: 'Document updated successfully',
            role,
            data: updatedDocument
        });
    } catch (error) {
        next(error);
    }
};

export const shareDocument = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { email, role } = req.body;

        if (!email || !role) {
            return res.status(400).json({ message: 'Email and role are required' });
        }

        if (!['viewer', 'editor'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role value' });
        }

        const { document, role: currentRole } = await getAccessibleDocument(id, req.lawyer._id);

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        if (!isOwner(currentRole)) {
            return res.status(403).json({ message: 'Only the owner can share this document' });
        }

        const lawyerToShare = await Lawyer.findOne({
            email: email.trim().toLowerCase()
        });

        if (!lawyerToShare) {
            return res.status(404).json({ message: 'Lawyer not found' });
        }

        if (lawyerToShare._id.toString() === req.lawyer._id.toString()) {
            return res.status(400).json({ message: 'You cannot share a document with yourself' });
        }

        const existingSharedUser = document.sharedWith.find(
            (item) => item.user.toString() === lawyerToShare._id.toString()
        );

        const wasAlreadyShared = Boolean(existingSharedUser);

        if (existingSharedUser) {
            existingSharedUser.role = role;
        } else {
            document.sharedWith.push({
                user: lawyerToShare._id,
                role
            });
        }

        await document.save();

        const documentTitle = document.title || document.name || 'a document';
        const ownerName = req.lawyer?.name || 'Someone';

        await createNotification({
            user: lawyerToShare._id,
            type: 'document_shared',
            title: wasAlreadyShared ? 'Document permission updated' : 'New document shared',
            message: wasAlreadyShared
                ? `${ownerName} updated your access for "${documentTitle}" to ${role}.`
                : `${ownerName} shared "${documentTitle}" with you as ${role}.`,
            sender: req.lawyer._id,
            document: document._id,
            meta: {
                documentId: document._id,
                role,
                action: wasAlreadyShared ? 'updated' : 'shared'
            }
        });
console.log("----- shareDocument DEBUG -----");
console.log("owner:", req.lawyer?._id?.toString());
console.log("shared target:", lawyerToShare._id.toString());
console.log(
    "updated sharedWith:",
    (document.sharedWith || []).map((item) => ({
        user: item.user?.toString?.(),
        role: item.role
    }))
);
console.log("--------------------------------");
        const updatedDocument = await Document.findById(document._id)
            .populate('user', 'name email')
            .populate('sharedWith.user', 'name email');

        res.status(200).json({
            success: true,
            message: 'Document shared successfully',
            data: updatedDocument
        });
    } catch (error) {
        next(error);
    }
};

export const removeSharedUser = async (req, res, next) => {
    try {
        const { id, userId } = req.params;

        const { document, role } = await getAccessibleDocument(id, req.lawyer._id);

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        if (!isOwner(role)) {
            return res.status(403).json({ message: 'Only the owner can remove shared users' });
        }

        const exists = document.sharedWith.some(
            (item) => item.user.toString() === userId.toString()
        );

        if (!exists) {
            return res.status(404).json({ message: 'Shared user not found' });
        }

        document.sharedWith = document.sharedWith.filter(
            (item) => item.user.toString() !== userId.toString()
        );

        await document.save();

        const updatedDocument = await Document.findById(document._id)
            .populate('user', 'name email')
            .populate('sharedWith.user', 'name email');

        res.status(200).json({
            success: true,
            message: 'Shared user removed successfully',
            data: updatedDocument
        });
    } catch (error) {
        next(error);
    }
};

export const verifyDocument = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'PDF dosyası eksik.' });
        }

        let currentBuffer = req.file.buffer;
        const markerBuffer = Buffer.from(MARKER, 'utf-8');

        const signatures = [];
        let isAllValid = true;
        let hasSignatures = false;

        while (true) {
            const markerIndex = currentBuffer.lastIndexOf(markerBuffer);
            if (markerIndex === -1) break;

            hasSignatures = true;

            const pdfPart = currentBuffer.slice(0, markerIndex);
            const payloadPart = currentBuffer.slice(markerIndex + markerBuffer.length);

            let embedData;
            try {
                embedData = JSON.parse(payloadPart.toString('utf-8'));
            } catch (e) {
                isAllValid = false;
                break;
            }

            const { signature, publicKey, originalHash, signerName, timestamp } = embedData;

            const currentHash = crypto.createHash('sha256').update(pdfPart).digest('hex');

            const verify = crypto.createVerify('SHA256');
            verify.update(pdfPart);
            verify.end();

            let isThisValid = false;
            try {
                isThisValid = verify.verify(publicKey, signature, 'base64');
            } catch (err) {
                isThisValid = false;
            }

            if (currentHash !== originalHash) {
                isThisValid = false;
            }

            if (!isThisValid) {
                isAllValid = false;
                break;
            }

            signatures.push({
                originalHash: currentHash,
                embeddedHash: originalHash,
                signerName,
                timestamp,
                signatureShort: signature.substring(0, 30) + '...'
            });

            currentBuffer = pdfPart;
        }

        if (!hasSignatures) {
            return res.json({
                valid: false,
                error: 'DİGİTAL İMZA BULUNAMADI: Dosyada gömülü imza verisi yok.'
            });
        }

        if (!isAllValid) {
            return res.json({
                valid: false,
                error: 'Geçersiz veya kurcalanmış imza tespit edildi.'
            });
        }

        signatures.reverse();

        res.status(200).json({
            success: true,
            valid: true,
            signatures
        });
    } catch (error) {
        console.error('Doğrulama hatası:', error);
        res.status(500).json({ error: 'Doğrulama işlemi sırasında sunucu hatası.' });
    }
};