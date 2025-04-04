import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';
import { Post } from '../posts/entities/post.entity';
import { PostTag } from '../posts/entities/post-tag.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { UserBlock } from '../users/entities/user-block.entity';
import { UserFollow } from '../users/entities/user-follow.entity';
import { Like } from '../likes/entities/like.entity';
import { PostsModule } from '../posts/posts.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PostsService } from '../posts/posts.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersModule } from '../users/users.module';
import { BadgeService } from '../users/services/badge.service';
import { UserStatsService } from 'src/users/services/ser-stats.service';
import { UsersService } from 'src/users/users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Comment,
      Post,           // Post repository
      PostTag,        // PostTag repository
      Notification,   // Notification repository
      User,           // User repository
      UserBlock,      // UserBlock repository
      UserFollow,     // UserFollow repository
      Like,           // Like repository
    ]),
    PostsModule,
    NotificationsModule,
    UsersModule,
  ],
  controllers: [CommentsController],
  providers: [
    CommentsService,
    PostsService,
    NotificationsService,
    UserStatsService,
    UsersService,
    BadgeService
  ],
  exports: [
    CommentsService,
    PostsService,
    NotificationsService,
    UserStatsService,
    UsersService,
    BadgeService
  ],
})
export class CommentsModule { }