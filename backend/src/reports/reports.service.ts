import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssetStatus, BorrowStatus, ConditionStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary() {
    const today = new Date();

    const [
      totalAssets,
      availableAssets,
      borrowedAssets,
      maintenanceAssets,
      lostAssets,
      pendingRequests,
      overdueRequests,
    ] = await Promise.all([
      this.prisma.asset.count(),
      this.prisma.asset.count({ where: { status: AssetStatus.AVAILABLE } }),
      this.prisma.asset.count({ where: { status: AssetStatus.BORROWED } }),
      this.prisma.asset.count({ where: { status: AssetStatus.MAINTENANCE } }),
      this.prisma.asset.count({ where: { status: AssetStatus.LOST } }),
      this.prisma.borrowRequest.count({
        where: { status: BorrowStatus.PENDING },
      }),
      this.prisma.borrowRequest.count({
        where: {
          status: BorrowStatus.BORROWED,
          expectedReturnDate: { lt: today },
        },
      }),
    ]);

    return {
      totalAssets,
      availableAssets,
      borrowedAssets,
      maintenanceAssets,
      lostAssets,
      pendingRequests,
      overdueRequests,
    };
  }

  async getBorrowedAssets() {
    return this.prisma.asset.findMany({
      where: { status: AssetStatus.BORROWED },
      include: {
        currentHolder: true,
        borrowRequests: {
          where: { status: BorrowStatus.BORROWED },
          include: { borrower: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async getOverdueAssets() {
    const today = new Date();
    return this.prisma.borrowRequest.findMany({
      where: {
        status: BorrowStatus.BORROWED,
        expectedReturnDate: { lt: today },
      },
      include: {
        asset: true,
        borrower: true,
      },
      orderBy: { expectedReturnDate: 'asc' },
    });
  }

  async getDamagedAssets() {
    return this.prisma.assetReturn.findMany({
      where: {
        condition: ConditionStatus.DAMAGED,
      },
      include: {
        asset: true,
        borrowRequest: {
          include: {
            borrower: true,
          },
        },
        recordedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { returnDate: 'desc' },
    });
  }

  async getEmployeeHistory(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) {
      throw new NotFoundException('ไม่พบข้อมูลพนักงานที่ระบุ');
    }

    return this.prisma.borrowRequest.findMany({
      where: { borrowerId: employeeId },
      include: {
        asset: true,
        assetReturn: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAssetHistory(assetId: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });
    if (!asset) {
      throw new NotFoundException('ไม่พบข้อมูลสินทรัพย์ที่ระบุ');
    }

    return this.prisma.borrowRequest.findMany({
      where: { assetId },
      include: {
        borrower: true,
        assetReturn: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
