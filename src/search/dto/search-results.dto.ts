// src/search/dto/search-results.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';

export class SearchResultsDto {
  @ApiProperty({ type: [User] })
  users: User[];

  @ApiProperty({ type: [Post] })
  posts: Post[];
}