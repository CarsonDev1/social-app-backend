import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { UsersModule } from '../users/users.module';
import { PostsModule } from '../posts/posts.module';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Post]),
    UsersModule,
    PostsModule,
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule { }