import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CloudinaryService } from '../uploads/cloudinary.service';
import { AssetStatus } from '@prisma/client';

@Injectable()
export class AssetsService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(dto: CreateAssetDto, actorId: string) {
    const existingCode = await this.prisma.asset.findUnique({
      where: { assetCode: dto.assetCode },
    });
    if (existingCode) {
      throw new BadRequestException('รหัสสินทรัพย์นี้ถูกใช้งานแล้วในระบบ');
    }

    const existingQR = await this.prisma.asset.findUnique({
      where: { qrCode: dto.qrCode },
    });
    if (existingQR) {
      throw new BadRequestException('รหัส QR Code นี้ถูกใช้งานแล้วในระบบ');
    }

    const asset = await this.prisma.asset.create({
      data: {
        ...dto,
        status: AssetStatus.AVAILABLE,
      },
    });

    await this.auditLogsService.log(
      actorId,
      'CREATE_ASSET',
      'Asset',
      asset.id,
      null,
      asset,
    );
    return asset;
  }

  async findAll() {
    return this.prisma.asset.findMany({
      include: {
        currentHolder: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: {
        currentHolder: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: true,
          },
        },
      },
    });
    if (!asset) {
      throw new NotFoundException('ไม่พบข้อมูลสินทรัพย์ที่ระบุ');
    }
    return asset;
  }

  async update(id: string, dto: UpdateAssetDto, actorId: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
    });
    if (!asset) {
      throw new NotFoundException('ไม่พบข้อมูลสินทรัพย์ที่ระบุ');
    }

    if (dto.assetCode && dto.assetCode !== asset.assetCode) {
      const existingCode = await this.prisma.asset.findUnique({
        where: { assetCode: dto.assetCode },
      });
      if (existingCode) {
        throw new BadRequestException('รหัสสินทรัพย์นี้ถูกใช้งานแล้วในระบบ');
      }
    }

    if (dto.qrCode && dto.qrCode !== asset.qrCode) {
      const existingQR = await this.prisma.asset.findUnique({
        where: { qrCode: dto.qrCode },
      });
      if (existingQR) {
        throw new BadRequestException('รหัส QR Code นี้ถูกใช้งานแล้วในระบบ');
      }
    }

    const updated = await this.prisma.asset.update({
      where: { id },
      data: dto as any,
    });

    await this.auditLogsService.log(
      actorId,
      'UPDATE_ASSET',
      'Asset',
      id,
      asset,
      updated,
    );
    return updated;
  }

  async uploadImage(id: string, fileBuffer: Buffer, actorId: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
    });
    if (!asset) {
      throw new NotFoundException('ไม่พบข้อมูลสินทรัพย์ที่ระบุ');
    }

    const result = await this.cloudinaryService.uploadImage(
      fileBuffer,
      'assets',
    );

    const updated = await this.prisma.asset.update({
      where: { id },
      data: {
        imageUrl: result.secure_url,
        cloudinaryPublicId: result.public_id,
      },
    });

    await this.auditLogsService.log(
      actorId,
      'UPLOAD_ASSET_IMAGE',
      'Asset',
      id,
      asset,
      updated,
    );
    return updated;
  }

  async remove(id: string, actorId: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
    });
    if (!asset) {
      throw new NotFoundException('ไม่พบข้อมูลสินทรัพย์ที่ระบุ');
    }

    try {
      await this.prisma.asset.delete({
        where: { id },
      });
      await this.auditLogsService.log(
        actorId,
        'DELETE_ASSET',
        'Asset',
        id,
        asset,
        null,
      );
    } catch {
      const retired = await this.prisma.asset.update({
        where: { id },
        data: { status: AssetStatus.RETIRED },
      });
      await this.auditLogsService.log(
        actorId,
        'RETIRE_ASSET',
        'Asset',
        id,
        asset,
        retired,
      );
      return {
        success: true,
        message: 'เปลี่ยนสถานะเป็น RETIRED เนื่องจากมีประวัติการทำรายการในระบบ',
      };
    }

    return { success: true, message: 'ลบสินทรัพย์เรียบร้อยแล้ว' };
  }

  async getHistory(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
    });
    if (!asset) {
      throw new NotFoundException('ไม่พบข้อมูลสินทรัพย์ที่ระบุ');
    }

    const borrowRequests = await this.prisma.borrowRequest.findMany({
      where: { assetId: id },
      include: {
        borrower: true,
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
        assetReturn: {
          include: {
            recordedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return borrowRequests;
  }
}
