// src/posts/entities/post-tag.entity.ts
import { Entity, ManyToOne, JoinColumn, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Post } from './post.entity';
import { User } from '../../users/entities/user.entity';

@Entity('post_tags')
export class PostTag extends BaseEntity {
  @Column({ name: 'post_id' })
  postId: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}