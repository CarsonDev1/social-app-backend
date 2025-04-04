// src/users/services/user-stats.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { BadgeService } from './badge.service';
import { Post } from '../../posts/entities/post.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { Like } from '../../likes/entities/like.entity';

@Injectable()
export class UserStatsService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(Like)
    private likesRepository: Repository<Like>,
    private badgeService: BadgeService,
  ) { }

  async recordUserLogin(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) return null;

    user.lastLoginAt = new Date();
    user.totalLoginCount += 1;

    return this.usersRepository.save(user);
  }

  async updateUserStats(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) return null;

    // Cập nhật số lượng bài viết
    const postsCount = await this.postsRepository.count({
      where: { userId },
    });
    user.totalPostsCount = postsCount;

    // Cập nhật số lượng bình luận
    const commentsCount = await this.commentsRepository.count({
      where: { userId },
    });
    user.totalCommentsCount = commentsCount;

    // Cập nhật số lượng like nhận được
    const likesReceived = await this.likesRepository.count({
      where: {
        post: {
          userId
        }
      },
      relations: ['post'],
    });
    user.totalLikesReceived = likesReceived;

    // Tính điểm thành viên
    user.points = this.calculatePoints(user);

    // Kiểm tra và cập nhật huy hiệu
    const earnedBadges = this.badgeService.checkUserBadges(user);
    user.badges = Array.from(new Set([...user.badges, ...earnedBadges]));

    return this.usersRepository.save(user);
  }

  private calculatePoints(user: User): number {
    // Cách tính điểm:
    // - 10 điểm cho mỗi bài viết
    // - 2 điểm cho mỗi bình luận
    // - 1 điểm cho mỗi like nhận được
    // - 5 điểm cho mỗi đăng nhập (tối đa 100 điểm)
    const postPoints = user.totalPostsCount * 10;
    const commentPoints = user.totalCommentsCount * 2;
    const likePoints = user.totalLikesReceived * 1;
    const loginPoints = Math.min(user.totalLoginCount * 5, 100);

    return postPoints + commentPoints + likePoints + loginPoints;
  }

  async getUserStats(userId: string): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) return null;

    // Lấy thông tin chi tiết về các huy hiệu
    const badgeDetails = user.badges.map(badgeType => {
      return this.badgeService.getBadgeDetails(badgeType);
    });

    // Tính thời gian thành viên
    const memberSinceDays = this.daysSince(user.memberSince);
    const years = Math.floor(memberSinceDays / 365);
    const months = Math.floor((memberSinceDays % 365) / 30);
    const days = memberSinceDays % 30;

    return {
      points: user.points,
      memberSince: user.memberSince,
      membershipDuration: {
        years,
        months,
        days,
        totalDays: memberSinceDays,
      },
      lastLogin: user.lastLoginAt,
      totalLogins: user.totalLoginCount,
      activity: {
        posts: user.totalPostsCount,
        comments: user.totalCommentsCount,
        likesReceived: user.totalLikesReceived,
      },
      badges: badgeDetails,
    };
  }

  private daysSince(date: Date): number {
    if (!date) return 0;
    const diffTime = Math.abs(new Date().getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}