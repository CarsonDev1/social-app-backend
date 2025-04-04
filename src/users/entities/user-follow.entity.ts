// src/users/entities/user-follow.entity.ts
import { Entity, ManyToOne, JoinColumn, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from './user.entity';

@Entity('user_follows')
@Index(['followerId', 'followingId'], { unique: true })
export class UserFollow extends BaseEntity {
  @Column({ name: 'follower_id' })
  followerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'follower_id' })
  follower: User;

  @Column({ name: 'following_id' })
  followingId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'following_id' })
  following: User;
}