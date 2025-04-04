import { Column, Entity, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { Like } from '../../likes/entities/like.entity';
import { PostTag } from 'src/posts/entities/post-tag.entity';

@Entity('posts')
export class Post extends BaseEntity {
  @OneToMany(() => PostTag, (tag) => tag.post)
  tags: PostTag[];

  @Column({
    type: 'enum',
    enum: ['public', 'private', 'followers'],
    default: 'public',
  })
  visibility: 'public' | 'private' | 'followers';

  @Column()
  content: string;

  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.post)
  likes: Like[];

  @Column({ default: 0 })
  likesCount: number;

  @Column({ default: 0 })
  commentsCount: number;
}