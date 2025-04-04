import { BeforeInsert, Column, Entity, Index, OneToMany } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';
import { Post } from '../../posts/entities/post.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { Like } from '../../likes/entities/like.entity';

@Entity('users')
export class User extends BaseEntity {

  @Column({ default: 0 })
  points: number;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @Column({ default: 0 })
  totalLoginCount: number;

  @Column("simple-array", { default: [] })
  badges: string[];

  @Column({ default: 0 })
  totalPostsCount: number;

  @Column({ default: 0 })
  totalCommentsCount: number;

  @Column({ default: 0 })
  totalLikesReceived: number;

  @Column({ nullable: true })
  memberSince: Date;

  @BeforeInsert()
  setMemberSince() {
    if (!this.memberSince) {
      this.memberSince = new Date();
    }
  }

  @Column({ nullable: true })
  coverImage: string;

  @Column({ default: false })
  isAdmin: boolean;

  @Column()
  fullName: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ nullable: true })
  @Index()
  username: string;

  @Column({ nullable: true })
  @Exclude()
  password: string;

  @Column({ nullable: true })
  profilePicture: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  googleId: string;

  @Column({ nullable: true })
  facebookId: string;

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.user)
  likes: Like[];

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
}