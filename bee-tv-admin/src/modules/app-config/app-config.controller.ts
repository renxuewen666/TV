import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { AppConfigService } from './app-config.service';

@ApiTags('APP配置下发')
@Public()
@Controller('app-config')
export class AppConfigController {
  constructor(private appConfigService: AppConfigService) {}

  /**
   * APP端获取完整配置
   * 这是APP启动后调用的主接口，返回所有需要的配置数据
   */
  @Get()
  getConfig(@Query('appId') appId?: string) {
    return this.appConfigService.getAppConfig(appId);
  }

  /**
   * 获取配置摘要（轻量版）
   */
  @Get('summary')
  getSummary(@Query('appId') appId?: string) {
    return this.appConfigService.getConfigSummary(appId);
  }
}
