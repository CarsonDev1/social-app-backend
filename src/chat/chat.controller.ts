// Step 59: Chat Controller (src/chat/chat.controller.ts)

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginationResponse } from '../common/interfaces/pagination-response.interface';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  @Post('rooms')
  @ApiOperation({ summary: 'Create a new chat room' })
  @ApiResponse({ status: 201, description: 'Chat room created successfully' })
  async createRoom(
    @Body() createChatRoomDto: CreateChatRoomDto,
    @CurrentUser() user: User,
  ): Promise<ChatRoom> {
    return this.chatService.createRoom(user.id, createChatRoomDto);
  }

  @Get('rooms')
  @ApiOperation({ summary: 'Get all chat rooms for current user' })
  @ApiResponse({ status: 200, description: 'Return all chat rooms' })
  async getUserRooms(@CurrentUser() user: User): Promise<ChatRoom[]> {
    return this.chatService.getUserRooms(user.id);
  }

  @Get('rooms/:id')
  @ApiOperation({ summary: 'Get a chat room by ID' })
  @ApiResponse({ status: 200, description: 'Return the chat room' })
  @ApiResponse({ status: 404, description: 'Chat room not found' })
  async getRoomById(@Param('id', ParseUUIDPipe) id: string): Promise<ChatRoom> {
    return this.chatService.findRoomById(id);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Create a new chat message' })
  @ApiResponse({ status: 201, description: 'Chat message created successfully' })
  async createMessage(
    @Body() createChatMessageDto: CreateChatMessageDto,
    @CurrentUser() user: User,
  ): Promise<ChatMessage> {
    return this.chatService.createMessage(user.id, createChatMessageDto);
  }

  @Get('rooms/:id/messages')
  @ApiOperation({ summary: 'Get all messages in a chat room (paginated)' })
  @ApiResponse({ status: 200, description: 'Return all messages in room' })
  async getRoomMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() paginationDto: PaginationDto,
    @CurrentUser() user: User,
  ): Promise<PaginationResponse<ChatMessage>> {
    return this.chatService.getRoomMessages(id, user.id, paginationDto);
  }

  @Post('messages/:id/read')
  @ApiOperation({ summary: 'Mark message as read' })
  @ApiResponse({ status: 200, description: 'Message marked as read' })
  async markMessageAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<ChatMessage> {
    return this.chatService.markMessageAsRead(id, user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get count of unread messages for current user' })
  @ApiResponse({ status: 200, description: 'Return unread messages count' })
  async getUnreadMessagesCount(@CurrentUser() user: User): Promise<{ count: number }> {
    const count = await this.chatService.getUnreadMessagesCount(user.id);
    return { count };
  }
}