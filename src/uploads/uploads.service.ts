
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class UploadsService {
  constructor(private readonly configService: ConfigService) {
    // Initialize Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get('cloudinary.cloudName'),
      api_key: this.configService.get('cloudinary.apiKey'),
      api_secret: this.configService.get('cloudinary.apiSecret'),
    });
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'social_app'): Promise<string> {
    try {

      console.log('Cloudinary config:', {
        cloud_name: this.configService.get('cloudinary.cloudName'),
        api_key_exists: !!this.configService.get('cloudinary.apiKey'),
        api_secret_exists: !!this.configService.get('cloudinary.apiSecret')
      })

      // Convert buffer to stream
      const stream = Readable.from(file.buffer);

      // Upload to Cloudinary
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );

        stream.pipe(uploadStream);
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  async uploadFiles(files: Express.Multer.File[], folder: string = 'social_app'): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  async deleteFile(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete file');
    }
  }
}