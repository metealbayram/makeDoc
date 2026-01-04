import express from 'express';
import path from 'path';
import cors from 'cors';
import { PORT } from './config/env.js';
import connectToDatabase from './database/mongodb.js';
import authRoutes from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import documentRouter from "./routes/documents.routes.js";
import eventsRouter from "./routes/events.routes.js";
const app = express();
app.use(cors({
    origin: (origin, callback) => {
        callback(null, true);
    },
    credentials: true
}));

app.use(express.json());
app.get('/', (req, res) => {
    res.send('Welcome to the Avukat PDF System!');
});
app.use('/auth', authRoutes);
app.use('/users', userRouter);
app.use('/documents', documentRouter);
app.use('/events', eventsRouter);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use((err, req, res, next) => {
    console.error(err);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({ success: false, message });
});

app.listen(PORT,  async () => {
    
    console.log(`Server running on https://localhost:${PORT}`);
   
    await connectToDatabase();
    // Restart trigger
});
export default app;