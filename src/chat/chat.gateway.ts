// Step 56: Chat Gateway (src/chat/chat.gateway.ts)

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { ChatMessage } from './entities/chat-message.entity';
import { WsUser } from '../common/decorators/ws-user.decorator';
import { User } from '../users/entities/user.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSocketMap = new Map<string, string>();

  constructor(private readonly chatService: ChatService) { }

  async handleConnection(client: Socket) {
    try {
      // Get token from handshake
      const token = client.handshake.auth.token;

      if (!token) {
        client.disconnect();
        return;
      }

      // Verify token
      // Note: This implementation depends on how you extract user from JWT
      // You might need to implement a custom solution or use a library
      // For simplicity, we're not implementing the full token verification here

      // Store user connection
      const userId = client.handshake.auth.userId;
      this.userSocketMap.set(userId, client.id);

      // Join user's rooms
      const rooms = await this.chatService.getUserRooms(userId);
      rooms.forEach((room) => {
        client.join(room.id);
      });

      console.log(`Client connected: ${client.id}, userId: ${userId}`);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Remove user connection
    for (const [userId, socketId] of this.userSocketMap.entries()) {
      if (socketId === client.id) {
        this.userSocketMap.delete(userId);
        break;
      }
    }

    console.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
    @WsUser() user: User,
  ) {
    try {
      // Check if room exists and user is participant
      const room = await this.chatService.findRoomById(roomId);
      const isParticipant = room.participants.some((p) => p.id === user.id);

      if (!isParticipant) {
        return { error: 'You are not a participant in this chat room' };
      }

      client.join(roomId);

      return { success: true, roomId };
    } catch (error) {
      return { error: error.message };
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    client.leave(roomId);
    return { success: true, roomId };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() createMessageDto: CreateChatMessageDto,
    @WsUser() user: User,
  ) {
    try {
      const message = await this.chatService.createMessage(user.id, createMessageDto);

      // Broadcast to room
      this.server.to(createMessageDto.roomId).emit('newMessage', message);

      return message;
    } catch (error) {
      return { error: error.message };
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() messageId: string,
    @WsUser() user: User,
  ) {
    try {
      const message = await this.chatService.markMessageAsRead(messageId, user.id);

      // Notify sender
      const senderSocketId = this.userSocketMap.get(message.senderId);
      if (senderSocketId) {
        this.server.to(senderSocketId).emit('messageRead', {
          messageId,
          readBy: user.id,
        });
      }

      return { success: true, messageId };
    } catch (error) {
      return { error: error.message };
    }
  }
}