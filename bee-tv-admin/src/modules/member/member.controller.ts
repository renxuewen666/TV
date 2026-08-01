import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { AllowAppUser } from '../../common/decorators/allow-app-user.decorator';
import { MemberService } from './member.service';
import { BatchMemberDto, CreateLevelDto, CreateMemberDto, UpdateLevelDto, UpdateMemberDto, CreateMemberRuleDto, UpdateMemberRuleDto } from './dto/member.dto';
import { SystemService } from '../system/system.service';

@ApiTags('会员配置')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminAuthGuard)
@Controller('member')
export class MemberController {
  constructor(private memberService: MemberService, private systemService: SystemService) {}

  @Get('levels')
  getLevels() { return this.memberService.getLevels(); }

  @Public()
  @Get('packages')
  getPackages() { return this.memberService.getPackages(); }

  @AllowAppUser()
  @UseGuards(JwtAuthGuard)
  @Post('purchase/balance')
  purchaseWithBalance(@Req() req: any, @Body() body: { groupId: number }) {
    if (req.user?.role !== 'user') throw new UnauthorizedException('请使用应用用户登录后购买会员');
    return this.memberService.purchaseWithBalance(Number(req.user.sub), Number(body.groupId));
  }

  @AllowAppUser()
  @UseGuards(JwtAuthGuard)
  @Post('purchase/score')
  purchaseWithScore(@Req() req: any, @Body() body: { groupId: number }) {
    if (req.user?.role !== 'user') throw new UnauthorizedException('请使用应用用户登录后购买会员');
    return this.memberService.purchaseWithScore(Number(req.user.sub), Number(body.groupId));
  }

  @Post('levels')
  createLevel(@Body() dto: CreateLevelDto) { return this.memberService.createLevel(dto); }

  @Put('levels/:id')
  updateLevel(@Param('id') id: string, @Body() dto: UpdateLevelDto) { return this.memberService.updateLevel(+id, dto); }

  @Delete('levels/:id')
  deleteLevel(@Param('id') id: string) { return this.memberService.deleteLevel(+id); }

  @Get('users')
  getMembers(@Query('page') page?: string, @Query('size') size?: string, @Query('group') group?: string, @Query('status') status?: string, @Query('keyword') keyword?: string) {
    return this.memberService.getMembers(+(page || 1), +(size || 20), group, status, keyword);
  }

  @Post('users')
  createMember(@Body() dto: CreateMemberDto) {
    return this.memberService.createMember(dto);
  }

  @Post('users/batch')
  batchUpdateMembers(@Body() dto: BatchMemberDto) {
    return this.memberService.batchUpdateMembers(dto);
  }

  @Put('users/:id')
  updateMember(@Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.memberService.updateMember(+id, dto);
  }

  @Post('users/:id/grant')
  grantMembership(@Param('id') id: string, @Body() body: { levelId: number; remark?: string }) {
    return this.memberService.grantMembership(+id, body.levelId, body.remark);
  }

  @Delete('users/:id')
  deleteMember(@Param('id') id: string) {
    return this.memberService.deleteMember(+id);
  }

  @Post('codes/generate')
  generateCodes(@Body() body: { levelId: number; count: number }) { return this.memberService.generateCodes(body.levelId, body.count); }

  @Get('codes')
  getCodes(@Query('page') page?: string, @Query('size') size?: string, @Query('status') status?: string) {
    return this.memberService.getCodes(+(page || 1), +(size || 20), status ? +status : undefined);
  }

  @Put('codes/:id')
  updateCode(@Param('id') id: string, @Body() body: any) {
    return this.memberService.updateCode(+id, body);
  }

  @Delete('codes/:id')
  deleteCode(@Param('id') id: string) {
    return this.memberService.deleteCode(+id);
  }

  @Post('codes/batch-delete')
  batchDeleteCodes(@Body() body: { ids: number[] }) {
    return this.memberService.batchDeleteCodes(body.ids || []);
  }

  @Get('rules')
  getRules(@Query('page') page?: string, @Query('size') size?: string, @Query('levelId') levelId?: string, @Query('status') status?: string) {
    return this.memberService.getRules(+(page || 1), +(size || 20), levelId ? +levelId : undefined, status ? +status : undefined);
  }

  @Post('rules')
  createRule(@Body() dto: CreateMemberRuleDto) { return this.memberService.createRule(dto); }

  @Put('rules/:id')
  updateRule(@Param('id') id: string, @Body() dto: UpdateMemberRuleDto) { return this.memberService.updateRule(+id, dto); }

  @Delete('rules/:id')
  deleteRule(@Param('id') id: string) { return this.memberService.deleteRule(+id); }

  @AllowAppUser()
  @UseGuards(JwtAuthGuard)
  @Post('activate')
  activate(@Req() req: any, @Body() body: { code: string }) {
    if (req.user.role !== 'user') throw new UnauthorizedException('请使用应用用户登录后兑换卡密');
    return this.memberService.activate(Number(req.user.sub), body.code);
  }

  @Get('balance-logs')
  async getBalanceLogs(@Query('page') page?: string, @Query('size') size?: string, @Query('userId') userId?: string) {
    return this.memberService.getBalanceLogs(+(page || 1), +(size || 20), userId);
  }

  @Get('score-logs')
  async getScoreLogs(@Query('page') page?: string, @Query('size') size?: string, @Query('userId') userId?: string) {
    return this.memberService.getScoreLogs(+(page || 1), +(size || 20), userId);
  }

  @Post('recharge/:userId')
  async recharge(@Param('userId') userId: string, @Body() body: { amount: number; method: string; remark?: string }) {
    return this.memberService.recharge(userId, body.amount, body.method, body.remark);
  }

  @Get('exportable-codes')
  async getExportableCodes(@Query('levelId') levelId?: number, @Query('status') status?: number) {
    return this.memberService.getExportableCodes(levelId, status);
  }
}