import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer', required: true },
    content: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Message', MessageSchema);
