// Step 61: Create Chat Message DTO (src/chat/dto/create-chat-message.dto.ts)

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateChatMessageDto {
  @ApiProperty({ example: 'Hello, how are you?' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsNotEmpty()
  @IsUUID()
  roomId: string;
}