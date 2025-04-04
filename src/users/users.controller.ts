
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginationResponse } from '../common/interfaces/pagination-response.interface';
import { UserBlock } from 'src/users/entities/user-block.entity';
import { UserFollow } from 'src/users/entities/user-follow.entity';
import { UserStatsService } from 'src/users/services/ser-stats.service';
import { BadgeService } from 'src/users/services/badge.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userStatsService: UserStatsService,
    private readonly badgeService: BadgeService,
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all users (paginated)' })
  @ApiResponse({ status: 200, description: 'Return all users' })
  async findAll(@Query() paginationDto: PaginationDto): Promise<PaginationResponse<User>> {
    return this.usersService.findAll(paginationDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Return current user profile' })
  async getProfile(@CurrentUser() user: User): Promise<User> {
    return user;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'Return the user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: User,
  ): Promise<User> {
    // Only allow users to update their own profile (or admin)
    if (id !== user.id && !user.isAdmin) {
      throw new UnauthorizedException('You can only update your own profile');
    }

    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    // Only allow users to delete their own account (or admin)
    if (id !== user.id && !user.isAdmin) {
      throw new UnauthorizedException('You can only delete your own account');
    }
    return this.usersService.delete(id);
  }

  // Thêm vào UsersController
  @Post('block/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Block a user' })
  async blockUser(
    @Param('userId', ParseUUIDPipe) blockedId: string,
    @Body() blockDto: { reason?: string },
    @CurrentUser() user: User,
  ): Promise<UserBlock> {
    return this.usersService.blockUser(user.id, blockedId, blockDto.reason);
  }

  @Delete('block/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Unblock a user' })
  async unblockUser(
    @Param('userId', ParseUUIDPipe) blockedId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.usersService.unblockUser(user.id, blockedId);
  }

  @Get('blocked')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all blocked users' })
  async getBlockedUsers(@CurrentUser() user: User): Promise<User[]> {
    return this.usersService.getBlockedUsers(user.id);
  }

  @Post('follow/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Follow a user' })
  async followUser(
    @Param('userId', ParseUUIDPipe) followingId: string,
    @CurrentUser() user: User,
  ): Promise<UserFollow> {
    return this.usersService.followUser(user.id, followingId);
  }

  @Delete('follow/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Unfollow a user' })
  async unfollowUser(
    @Param('userId', ParseUUIDPipe) followingId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.usersService.unfollowUser(user.id, followingId);
  }

  @Get(':userId/followers')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user followers' })
  async getFollowers(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<User[]> {
    return this.usersService.getFollowers(userId);
  }

  @Get(':userId/following')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get users that a user is following' })
  async getFollowing(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<User[]> {
    return this.usersService.getFollowing(userId);
  }

  @Put('cover-image')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update user cover image' })
  @ApiResponse({ status: 200, description: 'Cover image updated successfully' })
  async updateCoverImage(
    @Body() updateDto: { coverImage: string },
    @CurrentUser() user: User,
  ): Promise<User> {
    return this.usersService.update(user.id, { coverImage: updateDto.coverImage });
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user stats' })
  @ApiResponse({ status: 200, description: 'Return user statistics' })
  async getCurrentUserStats(@CurrentUser() user: User) {
    return this.userStatsService.getUserStats(user.id);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user stats by ID' })
  @ApiResponse({ status: 200, description: 'Return user statistics' })
  async getUserStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.userStatsService.getUserStats(id);
  }

  @Get('badges/all')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all available badges' })
  @ApiResponse({ status: 200, description: 'Return all badges' })
  async getAllBadges() {
    return this.badgeService.getAllBadges();
  }

  @Post('login-record')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Record user login' })
  @ApiResponse({ status: 200, description: 'Login recorded successfully' })
  async recordLogin(@CurrentUser() user: User) {
    return this.userStatsService.recordUserLogin(user.id);
  }

  @Post('update-stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update user statistics' })
  @ApiResponse({ status: 200, description: 'Stats updated successfully' })
  async updateStats(@CurrentUser() user: User) {
    return this.userStatsService.updateUserStats(user.id);
  }
}