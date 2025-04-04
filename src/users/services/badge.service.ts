import { Injectable } from '@nestjs/common';
import { BadgeType, Badge, BadgeCriteria } from '../interfaces/badges.interface';
import { User } from '../entities/user.entity';

@Injectable()
export class BadgeService {
  private readonly badges: Badge[] = [
    {
      type: BadgeType.NEWBIE,
      name: 'Newbie',
      description: 'New to the platform',
      imageUrl: '/assets/badges/newbie.svg',
      criteria: {
        memberSinceDays: 0,
      },
    },
    {
      type: BadgeType.MEMBER,
      name: 'Member',
      description: 'Active member for at least 30 days',
      imageUrl: '/assets/badges/member.svg',
      criteria: {
        memberSinceDays: 30,
      },
    },
    {
      type: BadgeType.CONTRIBUTOR,
      name: 'Contributor',
      description: 'Posted at least 10 times',
      imageUrl: '/assets/badges/contributor.svg',
      criteria: {
        postsCount: 10,
      },
    },
    {
      type: BadgeType.SENIOR,
      name: 'Senior',
      description: 'Active member for over 6 months with at least 50 posts',
      imageUrl: '/assets/badges/senior.svg',
      criteria: {
        memberSinceDays: 180,
        postsCount: 50,
      },
    },
    {
      type: BadgeType.VETERAN,
      name: 'Veteran',
      description: 'Active member for over 1 year with at least 100 posts',
      imageUrl: '/assets/badges/veteran.svg',
      criteria: {
        memberSinceDays: 365,
        postsCount: 100,
      },
    },
    {
      type: BadgeType.FREQUENT_POSTER,
      name: 'Frequent Poster',
      description: 'Posted at least 25 times',
      imageUrl: '/assets/badges/frequent_poster.svg',
      criteria: {
        postsCount: 25,
      },
    },
    {
      type: BadgeType.ACTIVE_COMMENTER,
      name: 'Active Commenter',
      description: 'Added at least 50 comments',
      imageUrl: '/assets/badges/active_commenter.svg',
      criteria: {
        commentsCount: 50,
      },
    },
    {
      type: BadgeType.POPULAR_CONTENT,
      name: 'Popular Content',
      description: 'Received at least 100 likes on posts',
      imageUrl: '/assets/badges/popular_content.svg',
      criteria: {
        likesReceived: 100,
      },
    },
    {
      type: BadgeType.EARLY_ADOPTER,
      name: 'Early Adopter',
      description: 'One of the first 100 members to join',
      imageUrl: '/assets/badges/early_adopter.svg',
      criteria: {
        earlyAdopter: true,
      },
    },
    {
      type: BadgeType.LONG_TIME_MEMBER,
      name: 'Long Time Member',
      description: 'Member for over 2 years',
      imageUrl: '/assets/badges/long_time_member.svg',
      criteria: {
        memberSinceDays: 730,
      },
    },
  ];

  checkUserBadges(user: User): string[] {
    const earnedBadges: string[] = [];
    const memberSinceDays = this.daysSince(user.memberSince);

    for (const badge of this.badges) {
      if (this.checkBadgeCriteria(badge.criteria, user, memberSinceDays)) {
        earnedBadges.push(badge.type);
      }
    }

    return earnedBadges;
  }

  private checkBadgeCriteria(criteria: BadgeCriteria, user: User, memberSinceDays: number): boolean {
    // Check each criterion
    if (criteria.memberSinceDays !== undefined && memberSinceDays < criteria.memberSinceDays) {
      return false;
    }

    if (criteria.postsCount !== undefined && user.totalPostsCount < criteria.postsCount) {
      return false;
    }

    if (criteria.commentsCount !== undefined && user.totalCommentsCount < criteria.commentsCount) {
      return false;
    }

    if (criteria.likesReceived !== undefined && user.totalLikesReceived < criteria.likesReceived) {
      return false;
    }

    if (criteria.earlyAdopter !== undefined) {
      // You would need to implement the specific logic for early adopter
      // This might involve checking a specific flag or user ID range
      // For now, just a placeholder
      // return user.isEarlyAdopter === criteria.earlyAdopter;
      return false; // Modify this based on your actual early adopter logic
    }

    return true;
  }

  getBadgeDetails(badgeType: string): Badge | undefined {
    return this.badges.find(badge => badge.type === badgeType);
  }

  getAllBadges(): Badge[] {
    return this.badges;
  }

  private daysSince(date: Date): number {
    if (!date) return 0;
    const diffTime = Math.abs(new Date().getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}