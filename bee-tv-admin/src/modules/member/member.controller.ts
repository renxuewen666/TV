import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { MemberService } from './member.service';
import { CreateLevelDto, UpdateLevelDto } from './dto/member.dto';

@ApiTags('会员配置')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('member')
export class MemberController {
  constructor(private memberService: MemberService) {}

  @Get('levels')
  getLevels() { return this.memberService.getLevels(); }

  @Post('levels')
  createLevel(@Body() dto: CreateLevelDto) { return this.memberService.createLevel(dto); }

  @Put('levels/:id')
  updateLevel(@Param('id') id: string, @Body() dto: UpdateLevelDto) { return this.memberService.updateLevel(+id, dto); }

  @Delete('levels/:id')
  deleteLevel(@Param('id') id: string) { return this.memberService.deleteLevel(+id); }

  @Get('users')
  getMembers(@Query('page') page?: string, @Query('size') size?: string) {
    return this.memberService.getMembers(+(page || 1), +(size || 20));
  }

  @Post('codes/generate')
  generateCodes(@Body() body: { levelId: number; count: number }) { return this.memberService.generateCodes(body.levelId, body.count); }

  @Get('codes')
  getCodes(@Query('page') page?: string, @Query('size') size?: string, @Query('status') status?: string) {
    return this.memberService.getCodes(+(page || 1), +(size || 20), status ? +status : undefined);
  }

  @Public()
  @Post('activate')
  activate(@Body() body: { userId: string; code: string }) {
    return this.memberService.activate(body.userId, body.code);
  }
}
