import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { MemberGroupService } from './member.group.service';
import { CreateMemberGroupDto, UpdateMemberGroupDto, QueryMemberGroupsDto } from './dto/member-group/create-member-group.dto';

@ApiTags('会员分组')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminAuthGuard)
@Controller('member/groups')
export class MemberGroupController {
  constructor(private memberGroupService: MemberGroupService) {}

  @Get()
  async getMemberGroups(@Query() query: QueryMemberGroupsDto) {
    return this.memberGroupService.getMemberGroups(query);
  }

  @Post()
  async createMemberGroup(@Body() dto: CreateMemberGroupDto) {
    return this.memberGroupService.createMemberGroup(dto);
  }

  @Put(':id')
  async updateMemberGroup(@Param('id') id: string, @Body() dto: UpdateMemberGroupDto) {
    return this.memberGroupService.updateMemberGroup(+id, dto);
  }

  @Delete(':id')
  async deleteMemberGroup(@Param('id') id: string) {
    return this.memberGroupService.deleteMemberGroup(+id);
  }
}