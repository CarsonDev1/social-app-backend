import {
  Column, Entity, ManyToOne, JoinColumn,
  CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { ChatRoom } from './chat-room.entity';
import { Exclude, Transform } from 'class-transformer';
import { formatVietnamDateTime } from 'src/common/utils/date-utils';

@Entity('chat_messages')
export class ChatMessage extends BaseEntity {
  @Column()
  content: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({ name: 'sender_id' })
  senderId: string;

  @ManyToOne(() => ChatRoom, (room) => room.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: ChatRoom;

  @Column({ name: 'room_id' })
  roomId: string;

  @Column({ default: false })
  isRead: boolean;

  // Ghi đè phương thức từ BaseEntity để đảm bảo thời gian Việt Nam
  @CreateDateColumn({ name: 'created_at' })
  @Transform(({ value }) => formatVietnamDateTime(value))
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @Transform(({ value }) => formatVietnamDateTime(value))
  updatedAt: Date;

  @Column({
    name: 'timestamp',
    type: 'bigint',
    nullable: true
  })
  timestamp: number;
}