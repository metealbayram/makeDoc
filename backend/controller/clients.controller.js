import Client from '../models/client.js';

export const createClient = async (req, res, next) => {
    try {
        const lawyerId = req.lawyer._id;
        const { name, tcNo, phone, email, address } = req.body;

        const existingClient = await Client.findOne({ tcNo });
        if (existingClient) {
             return res.status(400).json({ success: false, message: "Client with this TC No already exists" });
        }

        const client = await Client.create({
            lawyer: lawyerId,
            name,
            tcNo,
            phone,
            email,
            address
        });

        res.status(201).json({ success: true, data: client });
    } catch (error) {
        next(error);
    }
};

export const getClients = async (req, res, next) => {
    try {
        const lawyerId = req.lawyer._id;
        const clients = await Client.find({ lawyer: lawyerId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: clients });
    } catch (error) {
        next(error);
    }
};

export const deleteClient = async (req, res, next) => {
    try {
        const lawyerId = req.lawyer._id;
        const { id } = req.params;
        
        const client = await Client.findOneAndDelete({ _id: id, lawyer: lawyerId });
        if (!client) {
            return res.status(404).json({ success: false, message: "Client not found or not yours" });
        }
        
        res.status(200).json({ success: true, message: "Client deleted successfully" });
    } catch (error) {
        next(error);
    }
};
