// src/comments/entities/comment-tag.entity.ts
import { Entity, ManyToOne, JoinColumn, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Comment } from './comment.entity';
import { User } from '../../users/entities/user.entity';

@Entity('comment_tags')
export class CommentTag extends BaseEntity {
  @Column({ name: 'comment_id' })
  commentId: string;

  @ManyToOne(() => Comment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}