import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBorrowRequestDto } from './dto/create-borrow-request.dto';
import { RejectRequestDto } from './dto/reject-request.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { BorrowStatus, AssetStatus, Role } from '@prisma/client';

@Injectable()
export class BorrowRequestsService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(
    dto: CreateBorrowRequestDto,
    actorId: string,
    employeeId: string | null,
  ) {
    if (!employeeId) {
      throw new BadRequestException(
        'ไม่สามารถทำรายการได้ เนื่องจากบัญชีผู้ใช้ของคุณไม่ได้เชื่อมโยงกับพนักงาน',
      );
    }

    const asset = await this.prisma.asset.findUnique({
      where: { id: dto.assetId },
    });

    if (!asset) {
      throw new NotFoundException('ไม่พบข้อมูลสินทรัพย์ที่ระบุ');
    }

    if (asset.status !== AssetStatus.AVAILABLE) {
      throw new BadRequestException(
        'สินทรัพย์นี้ไม่พร้อมใช้งานสำหรับการยืม (สถานะปัจจุบัน: ' +
          asset.status +
          ')',
      );
    }

    // Generate Request Number (REQ-YYYYMMDD-XXXX)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;

    const count = await this.prisma.borrowRequest.count({
      where: {
        requestNo: {
          startsWith: `REQ-${dateStr}-`,
        },
      },
    });

    const seq = String(count + 1).padStart(4, '0');
    const requestNo = `REQ-${dateStr}-${seq}`;

    const request = await this.prisma.borrowRequest.create({
      data: {
        requestNo,
        borrowerId: employeeId,
        assetId: dto.assetId,
        borrowDate: new Date(dto.borrowDate),
        expectedReturnDate: new Date(dto.expectedReturnDate),
        purpose: dto.purpose,
        status: BorrowStatus.PENDING,
      },
      include: { asset: true, borrower: true },
    });

    await this.auditLogsService.log(
      actorId,
      'CREATE_BORROW_REQUEST',
      'BorrowRequest',
      request.id,
      null,
      request,
    );
    return request;
  }

  async findAll(user: any) {
    // Staff can only view their own requests. Admin, Approver, and Viewer can view all.
    const where: any = {};
    if (user.role === Role.STAFF && user.employeeId) {
      where.borrowerId = user.employeeId;
    }

    return this.prisma.borrowRequest.findMany({
      where,
      include: {
        asset: true,
        borrower: true,
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: any) {
    const request = await this.prisma.borrowRequest.findUnique({
      where: { id },
      include: {
        asset: true,
        borrower: true,
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('ไม่พบคำขอยืมสินทรัพย์');
    }

    // Security check: STAFF can only view their own requests
    if (user.role === Role.STAFF && request.borrowerId !== user.employeeId) {
      throw new BadRequestException('คุณไม่มีสิทธิ์เข้าถึงข้อมูลคำขอนี้');
    }

    return request;
  }

  async approve(id: string, actorId: string) {
    const request = await this.prisma.borrowRequest.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!request) {
      throw new NotFoundException('ไม่พบคำขอยืมสินทรัพย์');
    }

    if (request.status !== BorrowStatus.PENDING) {
      throw new BadRequestException(
        'คำขอนี้ได้รับการประมวลผลแล้ว (สถานะปัจจุบัน: ' + request.status + ')',
      );
    }

    // Use Prisma transaction for transactional business logic
    return this.prisma.$transaction(async (tx) => {
      const asset = await tx.asset.findUnique({
        where: { id: request.assetId },
      });

      if (!asset) {
        throw new NotFoundException('ไม่พบข้อมูลสินทรัพย์');
      }

      // Prevent approving requests for assets that are no longer available
      if (asset.status !== AssetStatus.AVAILABLE) {
        throw new BadRequestException(
          'ไม่สามารถอนุมัติได้ เนื่องจากสินทรัพย์ไม่อยู่ในสถานะพร้อมใช้งาน (สถานะปัจจุบัน: ' +
            asset.status +
            ')',
        );
      }

      // Update Asset status and current holder
      await tx.asset.update({
        where: { id: asset.id },
        data: {
          status: AssetStatus.BORROWED,
          currentHolderId: request.borrowerId,
        },
      });

      // Update Borrow Request status
      const updatedRequest = await tx.borrowRequest.update({
        where: { id },
        data: {
          status: BorrowStatus.BORROWED,
          approvedById: actorId,
          approvedAt: new Date(),
        },
        include: { asset: true, borrower: true },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'APPROVE_BORROW_REQUEST',
          entityType: 'BorrowRequest',
          entityId: id,
          oldData: request as any,
          newData: updatedRequest as any,
        },
      });

      return updatedRequest;
    });
  }

  async reject(id: string, dto: RejectRequestDto, actorId: string) {
    const request = await this.prisma.borrowRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('ไม่พบคำขอยืมสินทรัพย์');
    }

    if (request.status !== BorrowStatus.PENDING) {
      throw new BadRequestException(
        'คำขอนี้ได้รับการประมวลผลแล้ว (สถานะปัจจุบัน: ' + request.status + ')',
      );
    }

    const updatedRequest = await this.prisma.borrowRequest.update({
      where: { id },
      data: {
        status: BorrowStatus.REJECTED,
        rejectedReason: dto.rejectedReason,
        approvedById: actorId,
        approvedAt: new Date(),
      },
      include: { asset: true, borrower: true },
    });

    await this.auditLogsService.log(
      actorId,
      'REJECT_BORROW_REQUEST',
      'BorrowRequest',
      id,
      request,
      updatedRequest,
    );
    return updatedRequest;
  }

  async cancel(id: string, actorId: string, employeeId: string | null) {
    const request = await this.prisma.borrowRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('ไม่พบคำขอยืมสินทรัพย์');
    }

    if (request.borrowerId !== employeeId) {
      throw new BadRequestException('คุณไม่มีสิทธิ์ยกเลิกคำขอนี้');
    }

    if (request.status !== BorrowStatus.PENDING) {
      throw new BadRequestException(
        'สามารถยกเลิกได้เฉพาะคำขอที่อยู่ในสถานะ PENDING เท่านั้น',
      );
    }

    const updatedRequest = await this.prisma.borrowRequest.update({
      where: { id },
      data: {
        status: BorrowStatus.CANCELLED,
      },
      include: { asset: true, borrower: true },
    });

    await this.auditLogsService.log(
      actorId,
      'CANCEL_BORROW_REQUEST',
      'BorrowRequest',
      id,
      request,
      updatedRequest,
    );
    return updatedRequest;
  }
}
