import http from 'http';
import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { setupSocketIO } from './util/io';
import RequestError from './util/error';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import groupRoutes from './routes/groups';
import postRoutes from './routes/posts';
import messageRoutes from './routes/messages';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const server = http.createServer(app);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

setupSocketIO(server);

app.use('/auth', authRoutes);
app.use('/groups', groupRoutes);
app.use('/posts', postRoutes);
app.use('/users', userRoutes);
app.use(messageRoutes);

app.use((error: RequestError, req: Request, res: Response, next: NextFunction) => {
    return res.status(error.code || 500).json({
        message: error.message
    });
});

server.listen(8080, () => {
    console.log('Now listening on port 8080.');
});