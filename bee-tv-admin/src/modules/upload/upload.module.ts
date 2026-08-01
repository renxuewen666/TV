import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express/multer';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { UploadController } from './upload.controller';

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: uploadDir,
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname) || '';
          const name = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
          cb(null, name);
        },
      }),
    }),
  ],
  controllers: [UploadController],
})
export class UploadModule {}
