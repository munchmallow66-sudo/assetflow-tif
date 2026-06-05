import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('returns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateReturnDto, @CurrentUser() user: any) {
    return this.returnsService.create(dto, user.sub);
  }

  @Get()
  @Roles(Role.ADMIN, Role.APPROVER, Role.VIEWER)
  findAll() {
    return this.returnsService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.APPROVER, Role.VIEWER)
  findOne(@Param('id') id: string) {
    return this.returnsService.findOne(id);
  }
}
