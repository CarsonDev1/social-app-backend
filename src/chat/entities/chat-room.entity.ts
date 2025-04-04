import { Entity, ManyToMany, OneToMany, JoinTable } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { ChatMessage } from './chat-message.entity';

@Entity('chat_rooms')
export class ChatRoom extends BaseEntity {
  @ManyToMany(() => User)
  @JoinTable({
    name: 'chat_room_participants',
    joinColumn: { name: 'room_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  participants: User[];

  @OneToMany(() => ChatMessage, (message) => message.room)
  messages: ChatMessage[];
}