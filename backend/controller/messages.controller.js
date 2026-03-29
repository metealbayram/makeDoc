import Message from '../models/message.js';

export const sendMessage = async (req, res, next) => {
    try {
        const senderId = req.lawyer._id;
        const { receiverId, content } = req.body;

        if (!receiverId || !content) {
            return res.status(400).json({ success: false, message: "Receiver and content are required" });
        }

        const message = await Message.create({ sender: senderId, receiver: receiverId, content });
        res.status(201).json({ success: true, data: message });
    } catch (error) {
        next(error);
    }
};

export const getConversation = async (req, res, next) => {
    try {
        const userId = req.lawyer._id;
        const { otherUserId } = req.params;

        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: otherUserId },
                { sender: otherUserId, receiver: userId }
            ]
        }).sort({ createdAt: 1 });

        // Mark incoming messages as read
        await Message.updateMany(
            { sender: otherUserId, receiver: userId, isRead: false },
            { $set: { isRead: true } }
        );

        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        next(error);
    }
};

export const getUnreadMessages = async (req, res, next) => {
    try {
        const userId = req.lawyer._id;
        const unreadMessages = await Message.find({
            receiver: userId,
            isRead: false
        }).populate("sender", "name profileImage").sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: unreadMessages });
    } catch (error) {
        next(error);
    }
};
