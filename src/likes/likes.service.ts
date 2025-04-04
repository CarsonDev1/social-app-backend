import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './entities/like.entity';
import { PostsService } from '../posts/posts.service';
import { CreateLikeDto } from 'src/likes/dto/create-like.dto';
import { UserStatsService } from 'src/users/services/ser-stats.service';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private likesRepository: Repository<Like>,
    private readonly postsService: PostsService,
    private readonly userStatsService: UserStatsService,
  ) { }

  async likePost(userId: string, createLikeDto: CreateLikeDto): Promise<Like> {
    const { postId } = createLikeDto;

    // Check if post exists
    await this.postsService.findById(postId);

    // Check if already liked
    const existingLike = await this.likesRepository.findOne({
      where: { userId, postId },
    });

    if (existingLike) {
      throw new ConflictException('You have already liked this post');
    }

    const like = this.likesRepository.create({
      userId,
      postId,
    });

    const savedLike = await this.likesRepository.save(like);

    // Increment likes count on post
    await this.postsService.incrementLikesCount(postId);

    const post = await this.postsService.findById(postId);

    await this.userStatsService.updateUserStats(post.userId);
    return savedLike;
  }

  async unlikePost(userId: string, postId: string): Promise<void> {
    // Check if post exists
    await this.postsService.findById(postId);

    // Check if like exists
    const like = await this.likesRepository.findOne({
      where: { userId, postId },
    });

    if (!like) {
      throw new NotFoundException('You have not liked this post');
    }

    await this.likesRepository.delete(like.id);

    // Decrement likes count on post
    await this.postsService.decrementLikesCount(postId);
  }

  async checkLiked(userId: string, postId: string): Promise<boolean> {
    const like = await this.likesRepository.findOne({
      where: { userId, postId },
    });

    return !!like;
  }

  async getPostLikes(postId: string): Promise<Like[]> {
    return this.likesRepository.find({
      where: { postId },
      relations: ['user'],
    });
  }

  async getUserLikes(userId: string): Promise<Like[]> {
    return this.likesRepository.find({
      where: { userId },
      relations: ['post', 'post.user'],
    });
  }
}