import mongoose from 'mongoose';

const ClientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    tcNo: { type: String, required: true, unique: true },
    phone: String,
    email: String,
    address: String,
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Client', ClientSchema);
