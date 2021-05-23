import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes)

app.get('/', (req, res, next) => {
    res.send('Hello, World!');
});

app.listen(8080, () => {
    console.log('Now listening on port 8080.');
});