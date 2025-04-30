// src/friends/friends.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FriendsService } from './friends.service';
import { FriendRequest } from './entities/friend-request.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginationResponse } from '../common/interfaces/pagination-response.interface';
import { UsersService } from 'src/users/users.service';

@ApiTags('Friends')
@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService, private readonly usersService: UsersService) { }


  @Post('request/:userIdentifier')
  @ApiOperation({ summary: 'Send a friend request by ID or email' })
  @ApiResponse({ status: 201, description: 'Friend request sent successfully' })
  async sendFriendRequest(
    @Param('userIdentifier') userIdentifier: string,
    @CurrentUser() user: User,
  ): Promise<FriendRequest> {
    // Xác định xem userIdentifier là UUID hay email
    let receiverId: string;

    if (this.isValidUUID(userIdentifier)) {
      receiverId = userIdentifier;
    } else {
      // Giả sử đây là email, tìm người dùng
      const receiver = await this.usersService.findByEmail(userIdentifier);
      if (!receiver) {
        throw new BadRequestException(`User with email ${userIdentifier} not found`);
      }
      receiverId = receiver.id;
    }

    return this.friendsService.sendFriendRequest(user.id, receiverId);
  }
  // Hàm tiện ích để kiểm tra nếu một chuỗi là UUID hợp lệ
  private isValidUUID(uuid: string): boolean {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidPattern.test(uuid);
  }

  @Post('accept/:userIdentifier')
  @ApiOperation({ summary: 'Accept a friend request' })
  @ApiResponse({ status: 200, description: 'Friend request accepted' })
  async acceptFriendRequest(
    @Param('userIdentifier') userIdentifier: string,
    @CurrentUser() user: User,
  ): Promise<FriendRequest> {
    let senderId: string;

    if (this.isValidUUID(userIdentifier)) {
      senderId = userIdentifier;
    } else {
      const sender = await this.usersService.findByEmail(userIdentifier);
      if (!sender) {
        throw new BadRequestException(`User with email ${userIdentifier} not found`);
      }
      senderId = sender.id;
    }

    return this.friendsService.acceptFriendRequest(user.id, senderId);
  }

  @Post('reject/:userId')
  @ApiOperation({ summary: 'Reject a friend request' })
  @ApiResponse({ status: 200, description: 'Friend request rejected' })
  async rejectFriendRequest(
    @Param('userId', ParseUUIDPipe) senderId: string,
    @CurrentUser() user: User,
  ): Promise<FriendRequest> {
    return this.friendsService.rejectFriendRequest(user.id, senderId);
  }

  @Delete('request/:userId')
  @ApiOperation({ summary: 'Cancel a sent friend request' })
  @ApiResponse({ status: 200, description: 'Friend request canceled' })
  async cancelFriendRequest(
    @Param('userId', ParseUUIDPipe) receiverId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.friendsService.cancelFriendRequest(user.id, receiverId);
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Remove a friend' })
  @ApiResponse({ status: 200, description: 'Friend removed successfully' })
  async removeFriend(
    @Param('userId', ParseUUIDPipe) friendId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.friendsService.removeFriend(user.id, friendId);
  }

  @Get('requests/pending')
  @ApiOperation({ summary: 'Get pending friend requests' })
  @ApiResponse({ status: 200, description: 'Return pending friend requests' })
  async getPendingRequests(@CurrentUser() user: User): Promise<FriendRequest[]> {
    return this.friendsService.getPendingRequests(user.id);
  }

  @Get('requests/sent')
  @ApiOperation({ summary: 'Get sent friend requests' })
  @ApiResponse({ status: 200, description: 'Return sent friend requests' })
  async getSentRequests(@CurrentUser() user: User): Promise<FriendRequest[]> {
    return this.friendsService.getSentRequests(user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get friends list (paginated)' })
  @ApiResponse({ status: 200, description: 'Return friends list' })
  async getFriends(
    @CurrentUser() user: User,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginationResponse<User>> {
    return this.friendsService.getFriends(user.id, paginationDto);
  }

  @Get('check/:userId')
  @ApiOperation({ summary: 'Check if users are friends' })
  @ApiResponse({ status: 200, description: 'Return friendship status' })
  async checkFriendship(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: User,
  ): Promise<{ isFriend: boolean }> {
    const isFriend = await this.friendsService.isFriend(user.id, userId);
    return { isFriend };
  }
}