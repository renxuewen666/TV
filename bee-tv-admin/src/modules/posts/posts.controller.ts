import { Controller, Get, Post, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('APP-动态')
@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Public()
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('topic') topic?: string,
    @Query('userId') userId?: string,
  ) {
    return this.postsService.findAll({
      page: page ? +page : 1,
      topic,
      userId: userId ? +userId : undefined,
    });
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(+id);
  }

  @Post()
  create(@Req() req: any, @Body() dto: any) {
    return this.postsService.create(req.user.sub, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.postsService.remove(req.user.sub, +id);
  }

  @Post(':id/like')
  like(@Req() req: any, @Param('id') id: string) {
    return this.postsService.like(req.user.sub, +id);
  }

  @Post(':id/favorite')
  favorite(@Req() req: any, @Param('id') id: string) {
    return this.postsService.favorite(req.user.sub, +id);
  }

  @Public()
  @Get(':id/comments')
  getComments(@Param('id') id: string, @Query('page') page?: string) {
    return this.postsService.getComments(+id, page ? +page : 1);
  }

  @Post(':id/comments')
  addComment(@Req() req: any, @Param('id') id: string, @Body() dto: { content: string }) {
    return this.postsService.addComment(req.user.sub, +id, dto);
  }
}
