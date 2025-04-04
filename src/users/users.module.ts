// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserBlock } from './entities/user-block.entity';
import { UserFollow } from './entities/user-follow.entity';
import { BadgeService } from './services/badge.service';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';
import { Like } from '../likes/entities/like.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { UserStatsService } from 'src/users/services/ser-stats.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserBlock, UserFollow, Post, Comment, Like]),
    NotificationsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, BadgeService, UserStatsService],
  exports: [UsersService, BadgeService, UserStatsService],
})
export class UsersModule { }