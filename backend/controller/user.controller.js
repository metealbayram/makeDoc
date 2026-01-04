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
