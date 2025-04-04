// src/search/search.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchDto } from './dto/search.dto';
import { SearchResultsDto } from './dto/search-results.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) { }

  @Get()
  @Public() // Cho phép tìm kiếm không cần đăng nhập (kết quả sẽ bị giới hạn)
  @ApiOperation({ summary: 'Search for users and posts' })
  @ApiResponse({ status: 200, description: 'Return search results', type: SearchResultsDto })
  async search(
    @Query() searchDto: SearchDto,
    @CurrentUser() user?: User,
  ): Promise<SearchResultsDto> {
    return this.searchService.search(searchDto, user?.id);
  }

  @Get('advanced')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Advanced search with more filters' })
  @ApiResponse({ status: 200, description: 'Return search results', type: SearchResultsDto })
  async advancedSearch(
    @Query() searchDto: SearchDto,
    @CurrentUser() user: User,
  ): Promise<SearchResultsDto> {
    // Có thể mở rộng để thêm các bộ lọc khác trong tương lai
    return this.searchService.search(searchDto, user.id);
  }
}