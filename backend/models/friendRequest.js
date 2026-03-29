import mongoose from 'mongoose';

const FriendRequestSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('FriendRequest', FriendRequestSchema);
