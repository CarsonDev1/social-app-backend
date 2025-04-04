// Step 44: Comments Controller (src/comments/comments.controller.ts)

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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment } from './entities/comment.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginationResponse } from '../common/interfaces/pagination-response.interface';

@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new comment' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  async create(
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: User,
  ): Promise<Comment> {
    return this.commentsService.create(user.id, createCommentDto);
  }

  @Get('post/:postId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all comments for a post (paginated)' })
  @ApiResponse({ status: 200, description: 'Return all comments for a post' })
  async findByPostId(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginationResponse<Comment>> {
    return this.commentsService.findByPostId(postId, paginationDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a comment by ID' })
  @ApiResponse({ status: 200, description: 'Return the comment' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Comment> {
    return this.commentsService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a comment' })
  @ApiResponse({ status: 200, description: 'Comment updated successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser() user: User,
  ): Promise<Comment> {
    return this.commentsService.update(id, user.id, updateCommentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.commentsService.delete(id, user.id);
  }

  @Get(':id/replies')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get replies for a comment (paginated)' })
  @ApiResponse({ status: 200, description: 'Return replies for a comment' })
  async getReplies(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginationResponse<Comment>> {
    return this.commentsService.findReplies(id, paginationDto);
  }
}