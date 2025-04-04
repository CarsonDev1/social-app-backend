export enum BadgeType {
  NEWBIE = 'newbie',
  MEMBER = 'member',
  CONTRIBUTOR = 'contributor',
  SENIOR = 'senior',
  VETERAN = 'veteran',
  FREQUENT_POSTER = 'frequent_poster',
  ACTIVE_COMMENTER = 'active_commenter',
  POPULAR_CONTENT = 'popular_content',
  EARLY_ADOPTER = 'early_adopter',
  LONG_TIME_MEMBER = 'long_time_member',
}

export interface BadgeCriteria {
  memberSinceDays?: number;
  postsCount?: number;
  commentsCount?: number;
  likesReceived?: number;
  earlyAdopter?: boolean;
}

export interface Badge {
  type: BadgeType;
  name: string;
  description: string;
  imageUrl: string;
  criteria: BadgeCriteria;
}