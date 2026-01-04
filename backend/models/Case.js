// models/Case.js
import mongoose from 'mongoose';

const CaseSchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    caseType: { type: String, required: true },
    courtName: String,
    caseNumber: String,
    status: { type: String, enum: ['Açık', 'Kapalı'], default: 'Açık' },
    assignedAttorneyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Case', CaseSchema);
