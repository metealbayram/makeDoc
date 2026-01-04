import Event from '../models/Event.js';

export const createEvent = async (req, res, next) => {
    try {
        const { title, date, type, description } = req.body;

        if (!title || !date) {
            return res.status(400).json({ message: 'Title and Date are required' });
        }

        const event = await Event.create({
            title,
            date,
            type,
            description,
            user: req.lawyer._id
        });

        res.status(201).json({
            success: true,
            data: event
        });
    } catch (error) {
        next(error);
    }
};

export const getEvents = async (req, res, next) => {
    try {
        const { start, end } = req.query;
        let query = { user: req.lawyer._id };

        if (start && end) {
            query.date = {
                $gte: new Date(start),
                $lte: new Date(end)
            };
        }

        const events = await Event.find(query).sort({ date: 1 });

        res.status(200).json({
            success: true,
            data: events
        });
    } catch (error) {
        next(error);
    }
};

export const deleteEvent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const event = await Event.findOneAndDelete({ _id: id, user: req.lawyer._id });

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Event deleted'
        });
    } catch (error) {
        next(error);
    }
};
