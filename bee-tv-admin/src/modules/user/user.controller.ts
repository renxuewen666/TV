import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@ApiTags('管理员管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  findAll() { return this.userService.findAll(); }

  @Post()
  create(@Body() dto: CreateUserDto) { return this.userService.create(dto); }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) { return this.userService.update(+id, dto); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.userService.remove(+id); }
}
