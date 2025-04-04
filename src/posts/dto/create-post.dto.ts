import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: 'This is my new post content!' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ example: ['image1.jpg', 'image2.jpg'], required: false })
  @IsOptional()
  images?: string[];

  @ApiProperty({ example: ['userId1', 'userId2'], required: false })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  taggedUserIds?: string[];

  @ApiProperty({
    enum: ['public', 'private', 'followers'],
    default: 'public',
    required: false
  })
  @IsOptional()
  @IsEnum(['public', 'private', 'followers'])
  visibility?: 'public' | 'private' | 'followers' = 'public';
}