
import { Router } from 'express';
import authorize from '../middlewares/auth.middleware.js';
import { createDocument, getDocuments, downloadDocument, deleteDocument, updateDocumentStatus, getDocumentById, updateDocument } from '../controller/documents.controller.js';

const documentRouter = Router();



documentRouter.post('/create', authorize, createDocument);
documentRouter.get('/', authorize, getDocuments);
documentRouter.get('/:id/download', authorize, downloadDocument);
documentRouter.delete('/:id', authorize, deleteDocument);
documentRouter.put('/:id/status', authorize, updateDocumentStatus);
documentRouter.get('/:id', authorize, getDocumentById);
documentRouter.put('/:id', authorize, updateDocument);

export default documentRouter;
