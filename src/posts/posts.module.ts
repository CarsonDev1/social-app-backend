import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { Post } from './entities/post.entity';
import { UploadsModule } from '../uploads/uploads.module';
import { UsersModule } from 'src/users/users.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { PostTag } from 'src/posts/entities/post-tag.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, PostTag]),
    UploadsModule,
    UsersModule,
    NotificationsModule
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule { }