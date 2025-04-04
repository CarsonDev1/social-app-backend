import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginationResponse } from '../common/interfaces/pagination-response.interface';
import { NotificationType } from 'src/notifications/entities/notification.entity';
import { PostTag } from 'src/posts/entities/post-tag.entity';
import { UsersService } from 'src/users/users.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { UserStatsService } from 'src/users/services/ser-stats.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(PostTag)
    private postTagRepository: Repository<PostTag>,
    private readonly usersService: UsersService,
    private readonly userStatsService: UserStatsService,
    private readonly notificationsService: NotificationsService
  ) { }

  async create(userId: string, createPostDto: CreatePostDto): Promise<Post> {
    const { taggedUserIds, ...postData } = createPostDto;

    // Tạo post
    const post = this.postsRepository.create({
      ...postData,
      userId,
    });

    const savedPost = await this.postsRepository.save(post);

    // Xử lý tags nếu có
    if (taggedUserIds?.length) {
      const postTags = taggedUserIds.map(taggedUserId => ({
        postId: savedPost.id,
        userId: taggedUserId,
      }));

      await this.postTagRepository.save(postTags);

      // Tạo thông báo cho người dùng được tag
      for (const taggedUserId of taggedUserIds) {
        await this.notificationsService.create({
          userId: taggedUserId,
          senderId: userId,
          type: NotificationType.TAGGED_IN_POST,
          message: 'You were tagged in a post',
          referenceId: savedPost.id,
          referenceType: 'post',
        });
      }
    }
    await this.userStatsService.updateUserStats(userId);
    return savedPost;
  }

  async findAll(paginationDto: PaginationDto, currentUserId?: string): Promise<PaginationResponse<Post>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // Xây dựng query dựa trên quyền truy cập
    const queryBuilder = this.postsRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .skip(skip)
      .take(limit)
      .orderBy('post.createdAt', 'DESC');

    // Nếu người dùng đăng nhập, hiển thị các bài đăng cho họ có thể xem
    if (currentUserId) {
      queryBuilder.where(
        '(post.visibility = :public) OR ' +
        '(post.userId = :currentUserId) OR ' +
        '(post.visibility = :followers AND EXISTS(' +
        '  SELECT 1 FROM user_follows WHERE ' +
        '  follower_id = :currentUserId AND following_id = post.user_id' +
        '))',
        {
          public: 'public',
          currentUserId,
          followers: 'followers',
        }
      );
    } else {
      // Nếu không đăng nhập, chỉ hiển thị bài đăng công khai
      queryBuilder.where('post.visibility = :public', { public: 'public' });
    }

    // Không hiển thị bài đăng từ người dùng đã chặn/bị chặn
    if (currentUserId) {
      queryBuilder.andWhere('NOT EXISTS(' +
        'SELECT 1 FROM user_blocks WHERE ' +
        '(blocker_id = :currentUserId AND blocked_id = post.user_id) OR ' +
        '(blocker_id = post.user_id AND blocked_id = :currentUserId)' +
        ')', { currentUserId });
    }

    const [posts, totalItems] = await queryBuilder.getManyAndCount();

    return {
      items: posts,
      meta: {
        totalItems,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async findByUserId(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginationResponse<Post>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [posts, totalItems] = await this.postsRepository.findAndCount({
      where: { userId },
      skip,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
      relations: ['user'],
    });

    return {
      items: posts,
      meta: {
        totalItems,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async findById(id: string, currentUserId?: string): Promise<Post> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // Kiểm tra quyền xem bài đăng
    if (post.visibility !== 'public') {
      // Nếu bài đăng riêng tư, chỉ chủ sở hữu mới xem được
      if (post.visibility === 'private' && post.userId !== currentUserId) {
        throw new ForbiddenException('You do not have permission to view this post');
      }

      // Nếu chỉ hiển thị cho người theo dõi, kiểm tra người dùng có phải người theo dõi
      if (post.visibility === 'followers' && post.userId !== currentUserId) {
        const isFollowing = await this.usersService.isFollowing(currentUserId, post.userId);
        if (!isFollowing) {
          throw new ForbiddenException('You do not have permission to view this post');
        }
      }
    }

    return post;
  }

  async update(id: string, userId: string, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.findById(id);

    // Check if the post belongs to the user
    if (post.userId !== userId) {
      throw new UnauthorizedException('You can only update your own posts');
    }

    const updatedPost = this.postsRepository.merge(post, updatePostDto);
    return this.postsRepository.save(updatedPost);
  }

  async delete(id: string, userId: string): Promise<void> {
    const post = await this.findById(id);

    // Check if the post belongs to the user
    if (post.userId !== userId) {
      throw new UnauthorizedException('You can only delete your own posts');
    }

    await this.postsRepository.delete(id);
  }

  async incrementLikesCount(id: string): Promise<void> {
    await this.postsRepository.increment({ id }, 'likesCount', 1);
  }

  async decrementLikesCount(id: string): Promise<void> {
    await this.postsRepository.decrement({ id }, 'likesCount', 1);
  }

  async incrementCommentsCount(id: string): Promise<void> {
    await this.postsRepository.increment({ id }, 'commentsCount', 1);
  }

  async decrementCommentsCount(id: string): Promise<void> {
    await this.postsRepository.decrement({ id }, 'commentsCount', 1);
  }
}