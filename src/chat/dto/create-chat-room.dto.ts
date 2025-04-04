// Step 60: Chat DTOs (src/chat/dto/create-chat-room.dto.ts)

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateChatRoomDto {
  @ApiProperty({
    example: ['123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174000'],
    description: 'Array of participant user IDs'
  })
  @IsNotEmpty()
  @IsArray()
  @IsUUID(undefined, { each: true })
  participantIds: string[];
}