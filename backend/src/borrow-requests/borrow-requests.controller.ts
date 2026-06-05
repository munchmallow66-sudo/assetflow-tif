import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BorrowRequestsService } from './borrow-requests.service';
import { CreateBorrowRequestDto } from './dto/create-borrow-request.dto';
import { RejectRequestDto } from './dto/reject-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('borrow-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BorrowRequestsController {
  constructor(private readonly borrowRequestsService: BorrowRequestsService) {}

  @Post()
  @Roles(Role.STAFF, Role.ADMIN)
  create(@Body() dto: CreateBorrowRequestDto, @CurrentUser() user: any) {
    return this.borrowRequestsService.create(dto, user.sub, user.employeeId);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.borrowRequestsService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.borrowRequestsService.findOne(id, user);
  }

  @Patch(':id/approve')
  @Roles(Role.ADMIN, Role.APPROVER)
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.borrowRequestsService.approve(id, user.sub);
  }

  @Patch(':id/reject')
  @Roles(Role.ADMIN, Role.APPROVER)
  reject(
    @Param('id') id: string,
    @Body() dto: RejectRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.borrowRequestsService.reject(id, dto, user.sub);
  }

  @Patch(':id/cancel')
  @Roles(Role.STAFF, Role.ADMIN)
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.borrowRequestsService.cancel(id, user.sub, user.employeeId);
  }
}
