import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { AssetStatus, BorrowStatus, ConditionStatus } from '@prisma/client';

@Injectable()
export class ReturnsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateReturnDto, actorId: string) {
    const borrowRequest = await this.prisma.borrowRequest.findUnique({
      where: { id: dto.borrowRequestId },
      include: { asset: true },
    });

    if (!borrowRequest) {
      throw new NotFoundException('ไม่พบข้อมูลการยืมที่ระบุ');
    }

    // Prevent returning an already returned asset
    if (
      borrowRequest.status !== BorrowStatus.BORROWED &&
      borrowRequest.status !== BorrowStatus.OVERDUE
    ) {
      throw new BadRequestException(
        'ไม่สามารถคืนสินทรัพย์ได้ เนื่องจากรายการขอยืมไม่อยู่ในสถานะถูกยืมอยู่ (สถานะปัจจุบัน: ' +
          borrowRequest.status +
          ')',
      );
    }

    // Execute within transaction
    return this.prisma.$transaction(async (tx) => {
      let nextAssetStatus: AssetStatus = AssetStatus.AVAILABLE;
      if (dto.condition === ConditionStatus.DAMAGED) {
        nextAssetStatus = AssetStatus.MAINTENANCE;
      } else if (dto.condition === ConditionStatus.LOST) {
        nextAssetStatus = AssetStatus.LOST;
      }

      // Update Asset status and release holder
      await tx.asset.update({
        where: { id: borrowRequest.assetId },
        data: {
          status: nextAssetStatus,
          currentHolderId: null,
        },
      });

      // Update Borrow Request status to RETURNED
      await tx.borrowRequest.update({
        where: { id: dto.borrowRequestId },
        data: {
          status: BorrowStatus.RETURNED,
        },
      });

      // Create Asset Return log
      const assetReturn = await tx.assetReturn.create({
        data: {
          borrowRequestId: dto.borrowRequestId,
          assetId: borrowRequest.assetId,
          condition: dto.condition,
          conditionNote: dto.conditionNote || null,
          imageUrl: dto.imageUrl || null,
          cloudinaryPublicId: dto.cloudinaryPublicId || null,
          recordedById: actorId,
        },
        include: {
          borrowRequest: {
            include: {
              borrower: true,
            },
          },
          asset: true,
          recordedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'RETURN_ASSET',
          entityType: 'AssetReturn',
          entityId: assetReturn.id,
          newData: assetReturn as any,
        },
      });

      return assetReturn;
    });
  }

  async findAll() {
    return this.prisma.assetReturn.findMany({
      include: {
        borrowRequest: {
          include: {
            borrower: true,
          },
        },
        asset: true,
        recordedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { returnDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const assetReturn = await this.prisma.assetReturn.findUnique({
      where: { id },
      include: {
        borrowRequest: {
          include: {
            borrower: true,
          },
        },
        asset: true,
        recordedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!assetReturn) {
      throw new NotFoundException('ไม่พบข้อมูลบันทึกการส่งคืนที่ระบุ');
    }

    return assetReturn;
  }
}
