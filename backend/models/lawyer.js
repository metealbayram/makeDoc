// models/Lawyer.js
import mongoose from 'mongoose';

const LawyerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImage: { type: String, required: false },
    job: { type: String, required: false, default: 'Lawyer' },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer' }],
    createdAt: { type: Date, default: Date.now },
    loginVerificationCode: { type: String, default: null },
    loginVerificationExpire: { type: Date, default: null },
    loginVerificationAttempts: { type: Number, default: 0 }
    
});

export default mongoose.model('Lawyer', LawyerSchema);
