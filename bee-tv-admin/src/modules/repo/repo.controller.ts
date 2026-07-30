import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { RepoService } from './repo.service';
import { RepoScriptService } from './repo-script.service';
import { CreateRepoDto, UpdateRepoDto } from './dto/repo.dto';
import { CreateRepoScriptDto, UpdateRepoScriptDto, QueryRepoScriptDto } from './dto/repo-script.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

@ApiTags('仓库配置')
@Controller('repo')
export class RepoController {
  constructor(
    private repoService: RepoService,
    private repoScriptService: RepoScriptService,
  ) {}

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
  @Get('scripts')
  getScripts(@Query() query: QueryRepoScriptDto) { return this.repoScriptService.getScripts(query); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('scripts')
  createScript(@Body() dto: CreateRepoScriptDto) { return this.repoScriptService.createScript(dto); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('scripts/by-repo/:repoId')
  getScriptsByRepo(@Param('repoId') repoId: string) { return this.repoScriptService.getScriptsByRepo(+repoId); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('scripts/:id')
  updateScript(@Param('id') id: string, @Body() dto: UpdateRepoScriptDto) { return this.repoScriptService.updateScript(+id, dto); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('scripts/:id')
  deleteScript(@Param('id') id: string) { return this.repoScriptService.deleteScript(+id); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('scripts/:id/test')
  testScript(@Param('id') id: string) { return this.repoScriptService.testScript(+id); }

  @Public()
  @Get('active')
  getActiveRepos() { return this.repoService.getActiveRepos(); }

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
}
