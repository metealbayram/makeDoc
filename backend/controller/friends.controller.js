import FriendRequest from '../models/friendRequest.js';
import Lawyer from '../models/lawyer.js';
import { createNotification } from "../utils/createNotification.js";
import mongoose from 'mongoose';

export const sendRequest = async (req, res, next) => {
    try {
        const senderId = req.lawyer._id;
        const { receiverId } = req.body;

        if (!receiverId) {
            return res.status(400).json({
                success: false,
                message: "receiverId is required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid receiverId"
            });
        }

        if (senderId.toString() === receiverId.toString()) {
            return res.status(400).json({
                success: false,
                message: "Cannot send request to yourself"
            });
        }

        const receiver = await Lawyer.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const alreadyFriends = (receiver.friends || []).some(
            (friendId) => friendId.toString() === senderId.toString()
        );

        if (alreadyFriends) {
            return res.status(400).json({
                success: false,
                message: "Already friends"
            });
        }

        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ],
            status: { $in: ['pending', 'accepted'] }
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: "Friend request already exists or you are already friends"
            });
        }

        const newRequest = await FriendRequest.create({
            sender: senderId,
            receiver: receiverId
        });

        res.status(201).json({
            success: true,
            data: newRequest,
            message: "Friend request sent"
        });
    } catch (error) {
        console.error("sendRequest error:", error);
        next(error);
    }
};

export const getRequests = async (req, res, next) => {
    try {
        const userId = req.lawyer._id;
        const requests = await FriendRequest.find({ receiver: userId, status: 'pending' }).populate('sender', 'name email profileImage');
        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        next(error);
    }
};

export const getSentRequests = async (req, res, next) => {
    try {
        const userId = req.lawyer._id;
        const requests = await FriendRequest.find({ sender: userId, status: 'pending' });
        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        next(error);
    }
};


export const acceptRequest = async (req, res, next) => {
    try {
        const { requestId } = req.body;
        const userId = req.lawyer._id;

        const request = await FriendRequest.findOne({ _id: requestId, receiver: userId, status: 'pending' });
        if (!request) {
            return res.status(404).json({ success: false, message: "Friend request not found" });
        }

        request.status = 'accepted';
        await request.save();

        // Add each other to friends array
        await Lawyer.findByIdAndUpdate(userId, { $addToSet: { friends: request.sender } });
        await Lawyer.findByIdAndUpdate(request.sender, { $addToSet: { friends: userId } });

        res.status(200).json({ success: true, message: "Friend request accepted" });
    } catch (error) {
        next(error);
    }
};

export const rejectRequest = async (req, res, next) => {
    try {
        const { requestId } = req.body;
        const userId = req.lawyer._id;

        const request = await FriendRequest.findOne({ _id: requestId, receiver: userId, status: 'pending' });
        if (!request) {
            return res.status(404).json({ success: false, message: "Friend request not found" });
        }

        request.status = 'rejected';
        await request.save();

        res.status(200).json({ success: true, message: "Friend request rejected" });
    } catch (error) {
        next(error);
    }
};

export const getFriends = async (req, res, next) => {
    try {
        const userId = req.lawyer._id;
        const user = await Lawyer.findById(userId).populate('friends', 'name email profileImage');
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, data: user.friends || [] });
    } catch (error) {
        next(error);
    }
};
