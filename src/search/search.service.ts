// src/search/search.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like as TypeOrmLike } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { SearchDto } from 'src/search/dto/search.dto';
import { SearchResultsDto } from 'src/search/dto/search-results.dto';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
  ) { }

  async search(searchDto: SearchDto, currentUserId?: string): Promise<SearchResultsDto> {
    const { query, type, limit = 10 } = searchDto;

    // Initialize results
    const results: SearchResultsDto = {
      users: [],
      posts: [],
    };

    // Search for users if requested
    if (!type || type === 'users') {
      const userQuery = this.usersRepository.createQueryBuilder('user')
        .where('user.fullName LIKE :query', { query: `%${query}%` })
        .orWhere('user.username LIKE :query', { query: `%${query}%` })
        .orWhere('user.email LIKE :query', { query: `%${query}%` })
        .take(limit);

      // Don't include blocked users
      if (currentUserId) {
        userQuery.andWhere('NOT EXISTS(' +
          'SELECT 1 FROM user_blocks WHERE ' +
          '(blocker_id = :currentUserId AND blocked_id = user.id) OR ' +
          '(blocker_id = user.id AND blocked_id = :currentUserId)' +
          ')', { currentUserId });
      }

      results.users = await userQuery.getMany();
    }

    // Search for posts if requested
    if (!type || type === 'posts') {
      const postQuery = this.postsRepository.createQueryBuilder('post')
        .leftJoinAndSelect('post.user', 'user')
        .where('post.content LIKE :query', { query: `%${query}%` })
        .take(limit);

      // Respect post visibility
      if (currentUserId) {
        postQuery.andWhere(
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
        )// src/search/search.service.ts (tiếp tục)
      } else {
        // Không đăng nhập, chỉ hiển thị bài đăng công khai
        postQuery.andWhere('post.visibility = :public', { public: 'public' });
      }

      // Không hiển thị bài đăng từ người đã chặn/bị chặn
      if (currentUserId) {
        postQuery.andWhere('NOT EXISTS(' +
          'SELECT 1 FROM user_blocks WHERE ' +
          '(blocker_id = :currentUserId AND blocked_id = post.user_id) OR ' +
          '(blocker_id = post.user_id AND blocked_id = :currentUserId)' +
          ')', { currentUserId });
      }

      results.posts = await postQuery.getMany();
    }

    return results;
  }
}