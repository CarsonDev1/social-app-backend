import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  NEW_LIKE = 'new_like',
  NEW_COMMENT = 'new_comment',
  NEW_FOLLOWER = 'new_follower',
  NEW_FRIEND_REQUEST = 'new_friend_request',
  ACCEPTED_FRIEND_REQUEST = 'accepted_friend_request',
  TAGGED_IN_POST = 'tagged_in_post',
  TAGGED_IN_COMMENT = 'tagged_in_comment',
  COMMENT_REPLY = 'comment_reply',
}

@Entity('notifications')
export class Notification extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'sender_id', nullable: true })
  senderId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ name: 'reference_id', nullable: true })
  referenceId: string;

  @Column({ name: 'reference_type', nullable: true })
  referenceType: string;
}