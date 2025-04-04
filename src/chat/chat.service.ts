import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatRoom } from './entities/chat-room.entity';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';
import { UsersService } from '../users/users.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginationResponse } from '../common/interfaces/pagination-response.interface';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,

    @InjectRepository(ChatRoom)
    private chatRoomRepository: Repository<ChatRoom>,

    private readonly usersService: UsersService,
  ) { }

  async createRoom(userId: string, createChatRoomDto: CreateChatRoomDto): Promise<ChatRoom> {
    const { participantIds } = createChatRoomDto;

    // Add current user to participants if not already included
    if (!participantIds.includes(userId)) {
      participantIds.push(userId);
    }

    // Check if all participants exist
    const participants = await this.usersService.findManyByIds(participantIds);

    if (participants.length !== participantIds.length) {
      throw new NotFoundException('One or more users not found');
    }

    // Check if room already exists between these users (for direct messages)
    if (participantIds.length === 2) {
      const existingRoom = await this.findRoomByParticipants(participantIds);
      if (existingRoom) {
        return existingRoom;
      }
    }

    // Create new room
    const room = this.chatRoomRepository.create({
      participants,
    });

    return this.chatRoomRepository.save(room);
  }

  async findRoomByParticipants(participantIds: string[]): Promise<ChatRoom | null> {
    const rooms = await this.chatRoomRepository
      .createQueryBuilder('room')
      .innerJoin('room.participants', 'participant')
      .groupBy('room.id')
      .having('COUNT(DISTINCT participant.id) = :count', { count: participantIds.length })
      .andHaving('COUNT(DISTINCT participant.id) = COUNT(participant.id)')
      .getMany();

    if (!rooms.length) {
      return null;
    }

    const roomsWithParticipants = await Promise.all(
      rooms.map(async (room) => {
        const roomWithParticipants = await this.chatRoomRepository.findOne({
          where: { id: room.id },
          relations: ['participants'],
        });
        return roomWithParticipants;
      })
    );

    // Find room where all participants match exactly
    return roomsWithParticipants.find((room) => {
      const roomParticipantIds = room.participants.map((p) => p.id);
      return (
        roomParticipantIds.length === participantIds.length &&
        participantIds.every((id) => roomParticipantIds.includes(id))
      );
    });
  }

  async findRoomById(id: string): Promise<ChatRoom> {
    const room = await this.chatRoomRepository.findOne({
      where: { id },
      relations: ['participants'],
    });

    if (!room) {
      throw new NotFoundException(`Chat room with ID ${id} not found`);
    }

    return room;
  }

  async getUserRooms(userId: string): Promise<ChatRoom[]> {
    return this.chatRoomRepository
      .createQueryBuilder('room')
      .innerJoinAndSelect('room.participants', 'participant')
      .where('participant.id = :userId', { userId })
      .getMany();
  }

  async createMessage(userId: string, createChatMessageDto: CreateChatMessageDto): Promise<ChatMessage> {
    const { content, roomId } = createChatMessageDto;

    // Check if room exists and user is participant
    const room = await this.findRoomById(roomId);
    const isParticipant = room.participants.some((p) => p.id === userId);

    if (!isParticipant) {
      throw new NotFoundException('You are not a participant in this chat room');
    }

    const message = this.chatMessageRepository.create({
      content,
      roomId,
      senderId: userId,
    });

    return this.chatMessageRepository.save(message);
  }

  async getRoomMessages(
    roomId: string,
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginationResponse<ChatMessage>> {
    // Check if room exists and user is participant
    const room = await this.findRoomById(roomId);
    const isParticipant = room.participants.some((p) => p.id === userId);

    if (!isParticipant) {
      throw new NotFoundException('You are not a participant in this chat room');
    }

    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    const [messages, totalItems] = await this.chatMessageRepository.findAndCount({
      where: { roomId },
      skip,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
      relations: ['sender'],
    });

    return {
      items: messages,
      meta: {
        totalItems,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<ChatMessage> {
    const message = await this.chatMessageRepository.findOne({
      where: { id: messageId },
      relations: ['room', 'room.participants'],
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    // Check if user is participant
    const isParticipant = message.room.participants.some((p) => p.id === userId);

    if (!isParticipant) {
      throw new NotFoundException('You are not a participant in this chat room');
    }

    // Only mark as read if user is not the sender
    if (message.senderId !== userId) {
      message.isRead = true;
      await this.chatMessageRepository.save(message);
    }

    return message;
  }

  async getUnreadMessagesCount(userId: string): Promise<number> {
    const rooms = await this.getUserRooms(userId);
    const roomIds = rooms.map((room) => room.id);

    return this.chatMessageRepository.count({
      where: {
        roomId: In(roomIds),
        senderId: Not(userId),
        isRead: false,
      },
    });
  }
}