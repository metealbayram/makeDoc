import { Router } from 'express';
import multer from 'multer';
import authorize from '../middlewares/auth.middleware.js';
import {
    createDocument,
    getDocuments,
    downloadDocument,
    deleteDocument,
    updateDocumentStatus,
    getDocumentById,
    updateDocument,
    verifyDocument,
    shareDocument,
    removeSharedUser
} from '../controller/documents.controller.js';

const documentRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

documentRouter.post('/create', authorize, createDocument);
documentRouter.get('/', authorize, getDocuments);
documentRouter.get('/:id/download', authorize, downloadDocument);
documentRouter.delete('/:id', authorize, deleteDocument);
documentRouter.put('/:id/status', authorize, updateDocumentStatus);
documentRouter.get('/:id', authorize, getDocumentById);
documentRouter.put('/:id', authorize, updateDocument);
documentRouter.post('/verify', authorize, upload.single('pdf'), verifyDocument);
documentRouter.post('/:id/share', authorize, shareDocument);
documentRouter.delete('/:id/share/:userId', authorize, removeSharedUser);

export default documentRouter;