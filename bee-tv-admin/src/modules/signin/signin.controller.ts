import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { SigninService } from './signin.service';

@ApiTags('签到积分')
@Controller('signin')
export class SigninController {
  constructor(private signinService: SigninService) {}

  @Public()
  @Post()
  sign(@Body('userId') userId: string) { return this.signinService.sign(userId); }

  @Public()
  @Get('status')
  status(@Query('userId') userId: string) { return this.signinService.getStatus(userId); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('logs')
  getLogs(@Query('page') page?: string, @Query('size') size?: string, @Query('userId') userId?: string) {
    return this.signinService.getLogs(+(page || 1), +(size || 20), userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('scores')
  getScoreLogs(@Query('page') page?: string, @Query('size') size?: string, @Query('userId') userId?: string) {
    return this.signinService.getScoreLogs(+(page || 1), +(size || 20), userId);
  }
}
