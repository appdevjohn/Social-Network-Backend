import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import RequestError from './util/error';
import authRoutes from './routes/auth';
import groupRoutes from './routes/groups';
import postRoutes from './routes/posts';
import messageRoutes from './routes/messages';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/groups', groupRoutes);
app.use('/posts', postRoutes);
app.use(messageRoutes);

app.use((error: RequestError, req: Request, res: Response, next: NextFunction) => {
    console.error(error.message);
    return res.status(error.code || 500).json({
        message: error.message
    });
});

app.listen(8080, () => {
    console.log('Now listening on port 8080.');
});