import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LikesService } from './likes.service';
import { CreateLikeDto } from './dto/create-like.dto';
import { Like } from './entities/like.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Likes')
@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Like a post' })
  @ApiResponse({ status: 201, description: 'Post liked successfully' })
  @ApiResponse({ status: 409, description: 'Already liked the post' })
  async likePost(
    @Body() createLikeDto: CreateLikeDto,
    @CurrentUser() user: User,
  ): Promise<Like> {
    return this.likesService.likePost(user.id, createLikeDto);
  }

  @Delete(':postId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Unlike a post' })
  @ApiResponse({ status: 200, description: 'Post unliked successfully' })
  @ApiResponse({ status: 404, description: 'Like not found' })
  async unlikePost(
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.likesService.unlikePost(user.id, postId);
  }

  @Get('check/:postId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check if user liked a post' })
  @ApiResponse({ status: 200, description: 'Return like status' })
  async checkLiked(
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser() user: User,
  ): Promise<{ liked: boolean }> {
    const liked = await this.likesService.checkLiked(user.id, postId);
    return { liked };
  }

  @Get('post/:postId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all likes for a post' })
  @ApiResponse({ status: 200, description: 'Return all likes for a post' })
  async getPostLikes(
    @Param('postId', ParseUUIDPipe) postId: string,
  ): Promise<Like[]> {
    return this.likesService.getPostLikes(postId);
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all posts liked by current user' })
  @ApiResponse({ status: 200, description: 'Return all posts liked by user' })
  async getUserLikes(@CurrentUser() user: User): Promise<Like[]> {
    return this.likesService.getUserLikes(user.id);
  }
}