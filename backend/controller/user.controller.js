import Lawyer from '../models/lawyer.js';
import fs from 'fs';
import path from 'path';

export const getUsers = async (req, res, next) => {
    try {
        const users = await Lawyer.find().select('-password');
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
}

export const getUser = async (req, res, next) => {
    try {
        const user = await Lawyer.findById(req.params.id).select('-password');
        
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
}

export const getCurrentUser = async (req, res, next) => {
    try {
        const user = await Lawyer.findById(req.lawyer._id).select('-password');

        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
}

export const updateProfile = async (req, res, next) => {
    try {
        const userId = req.lawyer._id;
        const { name, email, job } = req.body;

        const user = await Lawyer.findById(userId);

        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        const trimmedName = typeof name === 'string' ? name.trim() : '';
        const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const trimmedJob = typeof job === 'string' ? job.trim() : '';

        if (!trimmedName || !trimmedEmail) {
            const error = new Error('Name and email are required');
            error.statusCode = 400;
            throw error;
        }

        if (trimmedEmail !== user.email) {
            const existingUser = await Lawyer.findOne({ email: trimmedEmail, _id: { $ne: userId } });
            if (existingUser) {
                const error = new Error('Email is already in use');
                error.statusCode = 409;
                throw error;
            }
        }

        user.name = trimmedName;
        user.email = trimmedEmail;
        user.job = trimmedJob || 'Lawyer';

        await user.save();

        const updatedUser = await Lawyer.findById(userId).select('-password');

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });
    } catch (error) {
        next(error);
    }
}

export const updateProfileImage = async (req, res, next) => {
    try {
        if (!req.file) {
             const error = new Error('No file uploaded');
             error.statusCode = 400;
             throw error;
        }

        const userId = req.lawyer._id; 
        const user = await Lawyer.findById(userId);

        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        // Delete old image if it exists
        if (user.profileImage) {
            const oldImagePath = path.join(process.cwd(), user.profileImage);
            if (fs.existsSync(oldImagePath)) {
                try {
                    fs.unlinkSync(oldImagePath);
                } catch (err) {
                    console.error("Error deleting old profile image:", err);
                }
            }
        }

        const profileImage = `/uploads/profile/${req.file.filename}`;
        user.profileImage = profileImage;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile image updated successfully',
            data: { profileImage }
        });

    } catch (error) {
        next(error);
    }
};
