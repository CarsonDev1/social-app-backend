// Step 64: Uploads Controller (src/uploads/uploads.controller.ts) - Fixed with @fastify/multipart

import {
  Controller,
  Post,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadsService } from './uploads.service';
import { FastifyRequest } from 'fastify';

@ApiTags('Uploads')
@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) { }

  @Post('single')
  @ApiOperation({ summary: 'Upload a single file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  async uploadFile(@Req() req: FastifyRequest): Promise<{ url: string }> {
    try {

      console.log('Starting file upload process');

      // Log request information
      console.log('Request headers:', req.headers);
      console.log('Is multipart?', req.isMultipart());

      const data = await req.file();
      if (!data) {
        throw new BadRequestException('No file uploaded');
      }

      // Validate file type
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimeTypes.includes(data.mimetype)) {
        throw new BadRequestException('File type not allowed. Only images are allowed.');
      }

      // Validate file size (5MB max)
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (data.file.bytesRead > MAX_SIZE) {
        throw new BadRequestException(`File size too large. Maximum size is ${MAX_SIZE / (1024 * 1024)}MB`);
      }

      // Create a buffer from the file
      const chunks = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Create a file object similar to what multer would provide
      const file = {
        fieldname: data.fieldname,
        originalname: data.filename,
        encoding: data.encoding,
        mimetype: data.mimetype,
        buffer: buffer,
        size: buffer.length,
      };

      const url = await this.uploadsService.uploadFile(file as any);
      return { url };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to process file upload');
    }
  }

  @Post('multiple')
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  async uploadFiles(@Req() req: FastifyRequest): Promise<{ urls: string[] }> {
    try {
      const files = [];
      const MAX_FILES = 10;
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB per file
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

      let fileCount = 0;
      let part = await req.parts();

      for await (const data of part) {
        if (data.type === 'file') {
          fileCount++;

          if (fileCount > MAX_FILES) {
            throw new BadRequestException(`Maximum ${MAX_FILES} files allowed`);
          }

          if (!allowedMimeTypes.includes(data.mimetype)) {
            throw new BadRequestException('File type not allowed. Only images are allowed.');
          }

          const chunks = [];
          for await (const chunk of data.file) {
            chunks.push(chunk);
          }

          const buffer = Buffer.concat(chunks);

          if (buffer.length > MAX_SIZE) {
            throw new BadRequestException(`File size too large. Maximum size is ${MAX_SIZE / (1024 * 1024)}MB`);
          }

          files.push({
            fieldname: data.fieldname,
            originalname: data.filename,
            encoding: data.encoding,
            mimetype: data.mimetype,
            buffer: buffer,
            size: buffer.length,
          });
        }
      }

      if (files.length === 0) {
        throw new BadRequestException('No files uploaded');
      }

      const urls = await this.uploadsService.uploadFiles(files as any);
      return { urls };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to process files upload');
    }
  }
}