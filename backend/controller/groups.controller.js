import Group from '../models/group.js';
import Lawyer from '../models/lawyer.js';

export const createGroup = async (req, res, next) => {
    try {
        const userId = req.lawyer._id;
        const { name, description, initialMembers } = req.body;

        const members = [userId];
        if (initialMembers && Array.isArray(initialMembers)) {
            members.push(...initialMembers);
        }

        const group = await Group.create({
            name,
            description,
            creator: userId,
            members: [...new Set(members)] // ensure uniqueness
        });

        res.status(201).json({ success: true, data: group, message: "Group created" });
    } catch (error) {
        next(error);
    }
};

export const getGroups = async (req, res, next) => {
    try {
        const userId = req.lawyer._id;
        const groups = await Group.find({ members: userId }).populate('members', 'name email profileImage').populate('creator', 'name email profileImage');
        res.status(200).json({ success: true, data: groups });
    } catch (error) {
        next(error);
    }
};

export const getGroup = async (req, res, next) => {
    try {
        const userId = req.lawyer._id;
        const { id } = req.params;

        const group = await Group.findOne({ _id: id, members: userId }).populate('members', 'name email profileImage').populate('creator', 'name email profileImage');
        if (!group) {
            return res.status(404).json({ success: false, message: "Group not found or you are not a member" });
        }

        res.status(200).json({ success: true, data: group });
    } catch (error) {
        next(error);
    }
};

export const addMember = async (req, res, next) => {
    try {
        const userId = req.lawyer._id;
        const { groupId } = req.params;
        const { memberId } = req.body;

        const group = await Group.findOne({ _id: groupId, members: userId });
        if (!group) {
            return res.status(404).json({ success: false, message: "Group not found or you are not a member" });
        }

        if (group.members.includes(memberId)) {
            return res.status(400).json({ success: false, message: "Member already in group" });
        }

        group.members.push(memberId);
        await group.save();

        res.status(200).json({ success: true, message: "Member added successfully", data: group });
    } catch (error) {
        next(error);
    }
};

export const removeMember = async (req, res, next) => {
    try {
        const userId = req.lawyer._id;
        const { groupId, memberId } = req.params;

        const group = await Group.findOne({ _id: groupId, members: userId });
        if (!group) {
            return res.status(404).json({ success: false, message: "Group not found or you are not a member" });
        }

        // Only creator can remove others, or user can remove themselves
        if (userId.toString() !== group.creator.toString() && userId.toString() !== memberId) {
            return res.status(403).json({ success: false, message: "You don't have permission to remove this member" });
        }

        group.members = group.members.filter(m => m.toString() !== memberId);
        await group.save();

        res.status(200).json({ success: true, message: "Member removed successfully", data: group });
    } catch (error) {
        next(error);
    }
};

export const deleteGroup = async (req, res, next) => {
    try {
        const userId = req.lawyer._id;
        const { id } = req.params;

        const group = await Group.findById(id);
        if (!group) return res.status(404).json({ success: false, message: "Group not found" });
        if (group.creator.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Only creator can delete this group" });
        }

        await Group.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Group deleted successfully" });
    } catch (error) {
        next(error);
    }
};
