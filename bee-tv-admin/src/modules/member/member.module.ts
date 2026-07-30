import { Module } from '@nestjs/common';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { MemberGroupController } from './member.group.controller';
import { MemberGroupService } from './member.group.service';
import { MembershipGrantService } from './membership-grant.service';
import { SystemModule } from '../system/system.module';

@Module({
  controllers: [MemberController, MemberGroupController],
  providers: [MemberService, MemberGroupService, MembershipGrantService],
  exports: [MemberService, MembershipGrantService],
  imports: [SystemModule],
})
export class MemberModule {}