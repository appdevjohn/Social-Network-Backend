import { Request } from 'express';
import multer from 'multer';

const supportedFileTypes = [
    'image/png',
    'image/jpg',
    'image/jpeg',
    'image/gif',
];

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (supportedFileTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('This file type is unsupported.'));
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

export const getUploadURL = (filename: string | null | undefined): string | null => {
    if (filename) {
        return 'http://localhost:8080/uploads/' + filename;
    } else {
        return null;
    }
}

export default upload;