import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @Roles(Role.ADMIN, Role.APPROVER, Role.VIEWER, Role.STAFF)
  getDashboardSummary() {
    return this.reportsService.getDashboardSummary();
  }

  @Get('borrowed-assets')
  @Roles(Role.ADMIN, Role.APPROVER, Role.VIEWER)
  getBorrowedAssets() {
    return this.reportsService.getBorrowedAssets();
  }

  @Get('overdue-assets')
  @Roles(Role.ADMIN, Role.APPROVER, Role.VIEWER)
  getOverdueAssets() {
    return this.reportsService.getOverdueAssets();
  }

  @Get('damaged-assets')
  @Roles(Role.ADMIN, Role.APPROVER, Role.VIEWER)
  getDamagedAssets() {
    return this.reportsService.getDamagedAssets();
  }

  @Get('employee-history/:employeeId')
  @Roles(Role.ADMIN, Role.APPROVER, Role.VIEWER)
  getEmployeeHistory(@Param('employeeId') employeeId: string) {
    return this.reportsService.getEmployeeHistory(employeeId);
  }

  @Get('asset-history/:assetId')
  @Roles(Role.ADMIN, Role.APPROVER, Role.VIEWER)
  getAssetHistory(@Param('assetId') assetId: string) {
    return this.reportsService.getAssetHistory(assetId);
  }
}
