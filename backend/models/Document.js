import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    name: { type: String, required: true },
    path: { type: String, required: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer', required: true },
    status: { type: String, default: "Draft", enum: ["Draft", "Approved"] }
}, { timestamps: true });

const Document = mongoose.model('Document', documentSchema);

export default Document;