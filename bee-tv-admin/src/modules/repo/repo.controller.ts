import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { RepoService } from './repo.service';
import { CreateRepoDto, UpdateRepoDto } from './dto/repo.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

@ApiTags('仓库配置')
@Controller('repo')
export class RepoController {
  constructor(private repoService: RepoService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() { return this.repoService.findAll(); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateRepoDto) { return this.repoService.create(dto); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRepoDto) { return this.repoService.update(+id, dto); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) { return this.repoService.remove(+id); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadJar(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.repoService.uploadJar(+id, file);
  }

  @Public()
  @Get(':id/download')
  async downloadJar(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.repoService.downloadJar(+id);
    res.set({ 'Content-Type': 'application/java-archive', 'Content-Disposition': `attachment; filename="repo-${id}.jar"` });
    res.send(buffer);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/test')
  testSpider(@Param('id') id: string, @Body() body: { action: string; params?: string; jarPort?: number }) {
    return this.repoService.testSpider(+id, body.action, body.params, body.jarPort);
  }

  @Public()
  @Get('active')
  getActiveRepos() { return this.repoService.getActiveRepos(); }
}
