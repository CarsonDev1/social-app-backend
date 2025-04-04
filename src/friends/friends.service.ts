// src/friends/friends.service.ts
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FriendRequest, FriendRequestStatus } from './entities/friend-request.entity';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginationResponse } from '../common/interfaces/pagination-response.interface';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(FriendRequest)
    private friendRequestRepository: Repository<FriendRequest>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) { }

  async sendFriendRequest(senderId: string, receiverId: string): Promise<FriendRequest> {
    // Không thể gửi lời mời kết bạn cho chính mình
    if (senderId === receiverId) {
      throw new BadRequestException('You cannot send a friend request to yourself');
    }

    // Kiểm tra người nhận có tồn tại không
    await this.usersService.findById(receiverId);

    // Kiểm tra nếu đã là bạn bè hoặc đã có lời mời
    const existingRequest = await this.friendRequestRepository.findOne({
      where: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    });

    if (existingRequest) {
      if (existingRequest.status === FriendRequestStatus.PENDING) {
        if (existingRequest.senderId === senderId) {
          throw new ConflictException('You have already sent a friend request to this user');
        } else {
          // Nếu đối phương đã gửi lời mời, tự động chấp nhận
          return this.acceptFriendRequest(receiverId, senderId);
        }
      } else if (existingRequest.status === FriendRequestStatus.ACCEPTED) {
        throw new ConflictException('You are already friends with this user');
      }
    }

    // Kiểm tra xem có block nhau không
    const isBlocked = await this.usersService.isBlocked(senderId, receiverId);
    if (isBlocked) {
      throw new BadRequestException('You cannot send a friend request to this user');
    }

    // Tạo lời mời kết bạn mới
    const friendRequest = this.friendRequestRepository.create({
      senderId,
      receiverId,
      status: FriendRequestStatus.PENDING,
    });

    const savedRequest = await this.friendRequestRepository.save(friendRequest);

    // Tạo thông báo
    await this.notificationsService.create({
      userId: receiverId,
      senderId,
      type: NotificationType.NEW_FRIEND_REQUEST,
      message: 'You have received a new friend request',
      referenceId: senderId,
      referenceType: 'user',
    });

    return savedRequest;
  }

  async acceptFriendRequest(receiverId: string, senderId: string): Promise<FriendRequest> {
    const friendRequest = await this.friendRequestRepository.findOne({
      where: {
        senderId,
        receiverId,
        status: FriendRequestStatus.PENDING,
      },
    });

    if (!friendRequest) {
      throw new NotFoundException('Friend request not found');
    }

    // Cập nhật trạng thái
    friendRequest.status = FriendRequestStatus.ACCEPTED;
    const updatedRequest = await this.friendRequestRepository.save(friendRequest);

    // Tạo thông báo
    await this.notificationsService.create({
      userId: senderId,
      senderId: receiverId,
      type: NotificationType.ACCEPTED_FRIEND_REQUEST,
      message: 'Your friend request has been accepted',
      referenceId: receiverId,
      referenceType: 'user',
    });

    return updatedRequest;
  }

  async rejectFriendRequest(receiverId: string, senderId: string): Promise<FriendRequest> {
    const friendRequest = await this.friendRequestRepository.findOne({
      where: {
        senderId,
        receiverId,
        status: FriendRequestStatus.PENDING,
      },
    });

    if (!friendRequest) {
      throw new NotFoundException('Friend request not found');
    }

    // Cập nhật trạng thái
    friendRequest.status = FriendRequestStatus.REJECTED;
    return this.friendRequestRepository.save(friendRequest);
  }

  async cancelFriendRequest(senderId: string, receiverId: string): Promise<void> {
    const result = await this.friendRequestRepository.delete({
      senderId,
      receiverId,
      status: FriendRequestStatus.PENDING,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Friend request not found');
    }
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    // Tìm kiếm relationship với trạng thái ACCEPTED
    // Cần tìm cả hai chiều (user là người gửi hoặc người nhận)
    const requestsToDelete = await this.friendRequestRepository.find({
      where: [
        {
          senderId: userId,
          receiverId: friendId,
          status: FriendRequestStatus.ACCEPTED,
        },
        {
          senderId: friendId,
          receiverId: userId,
          status: FriendRequestStatus.ACCEPTED,
        },
      ],
    });

    if (requestsToDelete.length === 0) {
      throw new NotFoundException('Friend relationship not found');
    }

    // Xóa tất cả các relationship tìm được
    await Promise.all(
      requestsToDelete.map(req =>
        this.friendRequestRepository.delete(req.id)
      )
    );
  }
  async getPendingRequests(userId: string): Promise<FriendRequest[]> {
    return this.friendRequestRepository.find({
      where: {
        receiverId: userId,
        status: FriendRequestStatus.PENDING,
      },
      relations: ['sender'],
    });
  }

  async getSentRequests(userId: string): Promise<FriendRequest[]> {
    return this.friendRequestRepository.find({
      where: {
        senderId: userId,
        status: FriendRequestStatus.PENDING,
      },
      relations: ['receiver'],
    });
  }

  async getFriends(userId: string, paginationDto: PaginationDto): Promise<PaginationResponse<User>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // Tìm tất cả các request được chấp nhận mà người dùng là người gửi
    const sentRequests = await this.friendRequestRepository.find({
      where: {
        senderId: userId,
        status: FriendRequestStatus.ACCEPTED,
      },
      relations: ['receiver'],
      skip,
      take: limit,
    });

    // Tìm tất cả các request được chấp nhận mà người dùng là người nhận
    const receivedRequests = await this.friendRequestRepository.find({
      where: {
        receiverId: userId,
        status: FriendRequestStatus.ACCEPTED,
      },
      relations: ['sender'],
      skip,
      take: limit,
    });

    // Kết hợp danh sách bạn bè
    const friends = [
      ...sentRequests.map(req => req.receiver),
      ...receivedRequests.map(req => req.sender),
    ];

    // Đếm tổng số bạn bè
    const totalSent = await this.friendRequestRepository.count({
      where: {
        senderId: userId,
        status: FriendRequestStatus.ACCEPTED,
      },
    });

    const totalReceived = await this.friendRequestRepository.count({
      where: {
        receiverId: userId,
        status: FriendRequestStatus.ACCEPTED,
      },
    });

    const totalItems = totalSent + totalReceived;

    return {
      items: friends,
      meta: {
        totalItems,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async isFriend(user1Id: string, user2Id: string): Promise<boolean> {
    const count = await this.friendRequestRepository.count({
      where: [
        {
          senderId: user1Id,
          receiverId: user2Id,
          status: FriendRequestStatus.ACCEPTED,
        },
        {
          senderId: user2Id,
          receiverId: user1Id,
          status: FriendRequestStatus.ACCEPTED,
        },
      ],
    });

    return count > 0;
  }
}