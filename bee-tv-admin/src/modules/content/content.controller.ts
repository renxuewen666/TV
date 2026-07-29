import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('APP-内容')
@Controller('content')
export class ContentController {
  constructor(private contentService: ContentService) {}

  @Public()
  @Get('home')
  getHome(@Query('p') p?: string, @Query('t') t?: string, @Query('f') f?: string) {
    return this.contentService.getHome({ p, t, f });
  }

  @Public()
  @Get('detail')
  detail(@Query('id') id: string) {
    return this.contentService.detail(id);
  }

  @Public()
  @Get('search')
  search(@Query('keyword') keyword: string, @Query('p') p?: string) {
    return this.contentService.search(keyword, { p });
  }

  @Public()
  @Get('types')
  getTypes() {
    return this.contentService.types();
  }
}
