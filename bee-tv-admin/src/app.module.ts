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
import { AppAuthModule } from './modules/app-auth/app-auth.module';
import { ContentModule } from './modules/content/content.module';
import { PostsModule } from './modules/posts/posts.module';
import { AppUserModule } from './modules/app-user/app-user.module';
import { AdvertisementModule } from './modules/advertisement/advertisement.module';
import { MarqueeModule } from './modules/marquee/marquee.module';
import { DanmakuModule } from './modules/danmaku/danmaku.module';
import { AppConfigModule } from './modules/app-config/app-config.module';
import { AdminLogModule } from './modules/admin-log/admin-log.module';
import { FongMiModule } from './modules/fongmi/fongmi.module';
import { UploadModule } from './modules/upload/upload.module';
import { AttachmentModule } from './modules/attachment/attachment.module';
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
    AppAuthModule,
    ContentModule,
    PostsModule,
    AppUserModule,
    AdvertisementModule,
    MarqueeModule,
    DanmakuModule,
    AppConfigModule,
    AdminLogModule,
    FongMiModule,
    UploadModule,
    AttachmentModule,
  ],
})
export class AppModule {}
