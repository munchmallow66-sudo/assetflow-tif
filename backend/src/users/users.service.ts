import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(dto: CreateUserDto, actorId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException('อีเมลนี้ถูกใช้งานแล้วในระบบ');
    }

    if (dto.employeeId) {
      const emp = await this.prisma.employee.findUnique({
        where: { id: dto.employeeId },
      });
      if (!emp) {
        throw new NotFoundException('ไม่พบข้อมูลพนักงานที่ระบุ');
      }

      const link = await this.prisma.user.findUnique({
        where: { employeeId: dto.employeeId },
      });
      if (link) {
        throw new BadRequestException(
          'พนักงานท่านนี้ได้รับการเชื่อมโยงกับบัญชีผู้ใช้แล้ว',
        );
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: dto.role,
        employeeId: dto.employeeId || null,
      },
      include: { employee: true },
    });

    const { password, ...result } = user;
    await this.auditLogsService.log(
      actorId,
      'CREATE_USER',
      'User',
      user.id,
      null,
      result,
    );
    return result;
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });
    return users.map(({ password, ...user }) => user);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!user) {
      throw new NotFoundException('ไม่พบผู้ใช้งานในระบบ');
    }
    const { password, ...result } = user;
    return result;
  }

  async update(id: string, dto: UpdateUserDto, actorId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('ไม่พบผู้ใช้งานในระบบ');
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) {
        throw new BadRequestException('อีเมลนี้ถูกใช้งานแล้วในระบบ');
      }
    }

    if (dto.employeeId && dto.employeeId !== user.employeeId) {
      const emp = await this.prisma.employee.findUnique({
        where: { id: dto.employeeId },
      });
      if (!emp) {
        throw new NotFoundException('ไม่พบข้อมูลพนักงานที่ระบุ');
      }

      const link = await this.prisma.user.findUnique({
        where: { employeeId: dto.employeeId },
      });
      if (link && link.id !== id) {
        throw new BadRequestException(
          'พนักงานท่านนี้ได้รับการเชื่อมโยงกับบัญชีผู้ใช้แล้ว',
        );
      }
    }

    const data: any = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      include: { employee: true },
    });

    const { password: oldPass, ...oldResult } = user;
    const { password: newPass, ...newResult } = updated;

    await this.auditLogsService.log(
      actorId,
      'UPDATE_USER',
      'User',
      id,
      oldResult,
      newResult,
    );
    return newResult;
  }

  async remove(id: string, actorId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('ไม่พบผู้ใช้งานในระบบ');
    }

    if (user.id === actorId) {
      throw new BadRequestException('คุณไม่สามารถลบบัญชีผู้ใช้งานของตนเองได้');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    const { password, ...result } = user;
    await this.auditLogsService.log(
      actorId,
      'DELETE_USER',
      'User',
      id,
      result,
      null,
    );
    return { success: true };
  }
}
