import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateAdminStatusDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isAdmin: boolean;
}