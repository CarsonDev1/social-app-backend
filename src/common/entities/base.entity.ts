// src/common/entities/base.entity.ts
import { getVietnamDateTime } from 'src/common/utils/date-utils';
import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate } from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  setCreatedAt() {
    this.createdAt = getVietnamDateTime();
  }

  @BeforeUpdate()
  setUpdatedAt() {
    this.updatedAt = getVietnamDateTime();
  }
}