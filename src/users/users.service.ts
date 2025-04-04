
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginationResponse } from '../common/interfaces/pagination-response.interface';
import { UserBlock } from 'src/users/entities/user-block.entity';
import { NotificationType } from 'src/notifications/entities/notification.entity';
import { UserFollow } from 'src/users/entities/user-follow.entity';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserBlock)
    private userBlockRepository: Repository<UserBlock>,
    @InjectRepository(UserFollow)
    private userFollowRepository: Repository<UserFollow>,
    private readonly notificationsService: NotificationsService
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async createFromOAuth(profile: any, provider: string): Promise<User> {
    const email = profile.emails[0].value;
    const fullName = profile.displayName || `${profile.name.givenName} ${profile.name.familyName}`;
    const profilePicture = profile.photos?.[0]?.value;

    const user = this.usersRepository.create({
      email,
      fullName,
      profilePicture,
      isVerified: true,
      ...(provider === 'google' ? { googleId: profile.id } : { facebookId: profile.id }),
    });

    return this.usersRepository.save(user);
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginationResponse<User>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [users, totalItems] = await this.usersRepository.findAndCount({
      skip,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      items: users,
      meta: {
        totalItems,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findManyByIds(ids: string[]): Promise<User[]> {
    return this.usersRepository.find({
      where: {
        id: In(ids),
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    const updatedUser = this.usersRepository.merge(user, updateUserDto);
    return this.usersRepository.save(updatedUser);
  }

  async delete(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async blockUser(blockerId: string, blockedId: string, reason?: string): Promise<UserBlock> {
    // Kiểm tra người dùng tồn tại
    await this.findById(blockedId);

    // Kiểm tra không tự block chính mình
    if (blockerId === blockedId) {
      throw new BadRequestException('Cannot block yourself');
    }

    // Kiểm tra xem đã block chưa
    const existingBlock = await this.userBlockRepository.findOne({
      where: { blockerId, blockedId },
    });

    if (existingBlock) {
      throw new ConflictException('User is already blocked');
    }

    // Tạo block mới
    const userBlock = this.userBlockRepository.create({
      blockerId,
      blockedId,
      reason,
    });

    return this.userBlockRepository.save(userBlock);
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    const result = await this.userBlockRepository.delete({
      blockerId,
      blockedId,
    });

    if (result.affected === 0) {
      throw new NotFoundException(`Block not found`);
    }
  }

  async getBlockedUsers(userId: string): Promise<User[]> {
    const blocks = await this.userBlockRepository.find({
      where: { blockerId: userId },
      relations: ['blocked'],
    });

    return blocks.map(block => block.blocked);
  }

  async isBlocked(userId: string, targetId: string): Promise<boolean> {
    const count = await this.userBlockRepository.count({
      where: [
        { blockerId: userId, blockedId: targetId },
        { blockerId: targetId, blockedId: userId },
      ],
    });

    return count > 0;
  }

  async followUser(followerId: string, followingId: string): Promise<UserFollow> {
    // Kiểm tra người dùng tồn tại
    await this.findById(followingId);

    // Kiểm tra không tự follow chính mình
    if (followerId === followingId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    // Kiểm tra xem đã follow chưa
    const existingFollow = await this.userFollowRepository.findOne({
      where: { followerId, followingId },
    });

    if (existingFollow) {
      throw new ConflictException('Already following this user');
    }

    // Kiểm tra block
    const isBlocked = await this.isBlocked(followerId, followingId);
    if (isBlocked) {
      throw new BadRequestException('Cannot follow this user');
    }

    // Tạo follow mới
    const userFollow = this.userFollowRepository.create({
      followerId,
      followingId,
    });

    const savedFollow = await this.userFollowRepository.save(userFollow);

    // Tạo thông báo
    await this.notificationsService.create({
      userId: followingId,
      senderId: followerId,
      type: NotificationType.NEW_FOLLOWER,
      message: 'You have a new follower',
      referenceId: followerId,
      referenceType: 'user',
    });

    return savedFollow;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const result = await this.userFollowRepository.delete({
      followerId,
      followingId,
    });

    if (result.affected === 0) {
      throw new NotFoundException(`Follow not found`);
    }
  }

  async getFollowers(userId: string): Promise<User[]> {
    const follows = await this.userFollowRepository.find({
      where: { followingId: userId },
      relations: ['follower'],
    });

    return follows.map(follow => follow.follower);
  }

  async getFollowing(userId: string): Promise<User[]> {
    const follows = await this.userFollowRepository.find({
      where: { followerId: userId },
      relations: ['following'],
    });

    return follows.map(follow => follow.following);
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const count = await this.userFollowRepository.count({
      where: { followerId, followingId },
    });

    return count > 0;
  }
}