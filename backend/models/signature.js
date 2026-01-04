// models/Signature.js
import mongoose from 'mongoose';

const SignatureSchema = new mongoose.Schema({
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
    lawyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer', required: true },
    signatureHash: { type: String, required: true },
    signedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Signature', SignatureSchema);
