import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LikesController } from './likes.controller';
import { LikesService } from './likes.service';
import { Like } from './entities/like.entity';
import { PostsModule } from '../posts/posts.module';
import { UsersModule } from '../users/users.module';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';
import { BadgeService } from '../users/services/badge.service';
import { UserStatsService } from 'src/users/services/ser-stats.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Like,
      User,     // Add User repository
      Post,     // Add Post repository
      Comment   // Add Comment repository
    ]),
    PostsModule,
    UsersModule
  ],
  controllers: [LikesController],
  providers: [
    LikesService,
    UserStatsService,
    BadgeService  // Add BadgeService as a provider
  ],
  exports: [LikesService, UserStatsService],
})
export class LikesModule { }