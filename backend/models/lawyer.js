// models/Lawyer.js
import mongoose from 'mongoose';

const LawyerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImage: { type: String, required: false },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Lawyer', LawyerSchema);
