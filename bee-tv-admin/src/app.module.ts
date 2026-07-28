import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { SystemModule } from './modules/system/system.module';
import { MemberModule } from './modules/member/member.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ApiManageModule } from './modules/api-manage/api-manage.module';
import { RepoModule } from './modules/repo/repo.module';
import { HomeLayoutModule } from './modules/home-layout/home-layout.module';
import { AppManageModule } from './modules/app-manage/app-manage.module';
import { EpayModule } from './modules/epay/epay.module';
import { NoticeModule } from './modules/notice/notice.module';
import { HotsearchModule } from './modules/hotsearch/hotsearch.module';
import { SigninModule } from './modules/signin/signin.module';
import { DatabaseModule } from './modules/database/database.module';
import { CompileModule } from './modules/compile/compile.module';
import { ScoreModule } from './modules/score/score.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PrismaModule } from './common/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UserModule,
    SystemModule,
    MemberModule,
    PaymentModule,
    ApiManageModule,
    RepoModule,
    HomeLayoutModule,
    AppManageModule,
    EpayModule,
    NoticeModule,
    HotsearchModule,
    SigninModule,
    DatabaseModule,
    CompileModule,
    ScoreModule,
    DashboardModule,
  ],
})
export class AppModule {}
