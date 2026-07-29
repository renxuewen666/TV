import { Controller, Post, Get, Body, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppAuthService } from './app-auth.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('APP-认证')
@Controller('member-auth')
export class AppAuthController {
  constructor(private appAuthService: AppAuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: { email: string; nickname: string; password: string }) {
    return this.appAuthService.register(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: { account: string; password: string }) {
    return this.appAuthService.login(dto);
  }

  @Get('me')
  getMe(@Req() req: any) {
    return this.appAuthService.getMe(req.user.sub);
  }
}
