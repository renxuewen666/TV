import { Controller, Get, Headers, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('APP-内容')
@Controller('content')
export class ContentController {
  constructor(private contentService: ContentService) {}

  @Public()
  @Get('home')
  getHome(@Query('p') p?: string, @Query('t') t?: string, @Query('f') f?: string, @Query('token') queryToken?: string, @Headers('authorization') authorization?: string, @Headers('token') headerToken?: string) {
    return this.contentService.getHome({ p, t, f }, this.getToken(authorization, headerToken, queryToken));
  }

  @Public()
  @Get('detail')
  detail(@Query('id') id: string, @Query('token') queryToken?: string, @Headers('authorization') authorization?: string, @Headers('token') headerToken?: string) {
    return this.contentService.detail(id, this.getToken(authorization, headerToken, queryToken));
  }

  @Public()
  @Get('search')
  search(@Query('keyword') keyword: string, @Query('p') p?: string, @Query('token') queryToken?: string, @Headers('authorization') authorization?: string, @Headers('token') headerToken?: string) {
    return this.contentService.search(keyword, { p }, this.getToken(authorization, headerToken, queryToken));
  }

  @Public()
  @Get('types')
  getTypes() {
    return this.contentService.types();
  }

  private getToken(authorization?: string, headerToken?: string, queryToken?: string) {
    return queryToken || headerToken || authorization?.replace(/^Bearer\s+/i, '') || '';
  }
}
