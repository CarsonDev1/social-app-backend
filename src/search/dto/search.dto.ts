import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchDto {
  @ApiProperty({ example: 'john', description: 'Search query' })
  @IsString()
  query: string;

  @ApiProperty({ enum: ['users', 'posts'], required: false })
  @IsOptional()
  @IsEnum(['users', 'posts'])
  type?: 'users' | 'posts';

  @ApiProperty({ minimum: 1, maximum: 50, default: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}