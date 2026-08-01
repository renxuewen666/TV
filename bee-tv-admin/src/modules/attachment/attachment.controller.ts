import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AttachmentService } from './attachment.service';
import { CreateAttachmentDto, UpdateAttachmentDto } from './dto/attachment.dto';

@ApiTags('附件管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attachment')
export class AttachmentController {
  constructor(private attachmentService: AttachmentService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('keyword') keyword?: string,
    @Query('module') module?: string,
    @Query('type') type?: string,
  ) {
    return this.attachmentService.list(
      +(page || 1),
      +(size || 20),
      keyword,
      module,
      type,
    );
  }

  @Post()
  create(@Body() dto: CreateAttachmentDto) {
    return this.attachmentService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAttachmentDto) {
    return this.attachmentService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.attachmentService.remove(+id);
  }
}
