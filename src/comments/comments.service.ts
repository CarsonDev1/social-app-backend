import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginationResponse } from '../common/interfaces/pagination-response.interface';
import { PostsService } from '../posts/posts.service';
import { NotificationType } from 'src/notifications/entities/notification.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { UserStatsService } from 'src/users/services/ser-stats.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    private readonly postsService: PostsService,
    private readonly userStatsService: UserStatsService,
    private readonly notificationsService: NotificationsService
  ) { }

  async create(userId: string, createCommentDto: CreateCommentDto): Promise<Comment> {
    // Check if post exists
    await this.postsService.findById(createCommentDto.postId);

    // Check if this is a reply
    if (createCommentDto.parentId) {
      // Validate parent comment
      const parentComment = await this.findById(createCommentDto.parentId);

      // Create comment as a reply
      const comment = this.commentsRepository.create({
        ...createCommentDto,
        userId,
        isReply: true,
      });

      const savedComment = await this.commentsRepository.save(comment);

      // Increment replies count on parent comment
      await this.incrementRepliesCount(parentComment.id);

      // Increment comments count on post
      await this.postsService.incrementCommentsCount(createCommentDto.postId);

      // Create notification for parent comment author
      if (parentComment.userId !== userId) {
        await this.notificationsService.create({
          userId: parentComment.userId,
          senderId: userId,
          type: NotificationType.COMMENT_REPLY,
          message: 'Someone replied to your comment',
          referenceId: savedComment.id,
          referenceType: 'comment',
        });
      }
      await this.userStatsService.updateUserStats(userId);
      return savedComment;
    } else {
      // Regular comment (not a reply)
      const comment = this.commentsRepository.create({
        ...createCommentDto,
        userId,
        isReply: false,
      });

      const savedComment = await this.commentsRepository.save(comment);

      // Increment comments count on post
      await this.postsService.incrementCommentsCount(createCommentDto.postId);
      await this.userStatsService.updateUserStats(userId);
      return savedComment;
    }
  }

  async findReplies(commentId: string, paginationDto: PaginationDto): Promise<PaginationResponse<Comment>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [replies, totalItems] = await this.commentsRepository.findAndCount({
      where: { parentId: commentId },
      skip,
      take: limit,
      order: {
        createdAt: 'ASC',
      },
      relations: ['user'],
    });

    return {
      items: replies,
      meta: {
        totalItems,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async incrementRepliesCount(id: string): Promise<void> {
    await this.commentsRepository.increment({ id }, 'repliesCount', 1);
  }

  async decrementRepliesCount(id: string): Promise<void> {
    await this.commentsRepository.decrement({ id }, 'repliesCount', 1);
  }


  async findByPostId(
    postId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginationResponse<Comment>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [comments, totalItems] = await this.commentsRepository.findAndCount({
      where: { postId },
      skip,
      take: limit,
      order: {
        createdAt: 'ASC',
      },
      relations: ['user'],
    });

    return {
      items: comments,
      meta: {
        totalItems,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async findById(id: string): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({
      where: { id },
      relations: ['user', 'post'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return comment;
  }

  async update(id: string, userId: string, updateCommentDto: UpdateCommentDto): Promise<Comment> {
    const comment = await this.findById(id);

    // Check if the comment belongs to the user
    if (comment.userId !== userId) {
      throw new UnauthorizedException('You can only update your own comments');
    }

    const updatedComment = this.commentsRepository.merge(comment, updateCommentDto);
    return this.commentsRepository.save(updatedComment);
  }

  async delete(id: string, userId: string): Promise<void> {
    const comment = await this.findById(id);

    // Check if the comment belongs to the user
    if (comment.userId !== userId) {
      throw new UnauthorizedException('You can only delete your own comments');
    }

    // If it's a reply, decrement replies count on parent
    if (comment.isReply && comment.parentId) {
      await this.decrementRepliesCount(comment.parentId);
    }

    await this.commentsRepository.delete(id);

    // Decrement comments count on post
    await this.postsService.decrementCommentsCount(comment.postId);
  }
}