import mongoose from 'mongoose';

const GroupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer' }],
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Group', GroupSchema);
