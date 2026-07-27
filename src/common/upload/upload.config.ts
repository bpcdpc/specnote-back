// npm i @nestjs/serve-static@5
// npm i -D @types/multer
import {memoryStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';

export const UPLOAD_DIR = "uploads";

const ALLOWED_MIME = ["image/jpeg","image/png","image/gif", "image/webp"];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5mb

//FileInterceptor 에 그대로 넘길 옵션 (멀터)
export const imageUploadOptions = {
    storage: memoryStorage(),
    fileFilter: (_req, file, callback) => {
        if(!ALLOWED_MIME.includes(file.mimetype)) {
            callback(
                new BadRequestException(`이미지 파일만 올수있어요`), false
            );
            return;
        }
        callback(null ,true)
    },
    limits: { fileSize: MAX_FILE_SIZE },
};