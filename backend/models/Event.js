import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    date: { type: Date, required: true },
    type: { 
        type: String, 
        enum: ['meeting', 'court', 'deadline', 'internal', 'document'],
        default: 'meeting'
    },
    description: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer', required: true },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' }
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);

export default Event;
