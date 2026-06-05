import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(dto: CreateEmployeeDto, actorId: string) {
    const existingCode = await this.prisma.employee.findUnique({
      where: { employeeCode: dto.employeeCode },
    });
    if (existingCode) {
      throw new BadRequestException('รหัสพนักงานนี้ถูกใช้งานแล้วในระบบ');
    }

    const existingEmail = await this.prisma.employee.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new BadRequestException('อีเมลพนักงานนี้ถูกใช้งานแล้วในระบบ');
    }

    const employee = await this.prisma.employee.create({
      data: dto,
    });

    await this.auditLogsService.log(
      actorId,
      'CREATE_EMPLOYEE',
      'Employee',
      employee.id,
      null,
      employee,
    );
    return employee;
  }

  async findAll() {
    return this.prisma.employee.findMany({
      orderBy: { employeeCode: 'asc' },
    });
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!employee) {
      throw new NotFoundException('ไม่พบข้อมูลพนักงานที่ระบุ');
    }
    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto, actorId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
    });
    if (!employee) {
      throw new NotFoundException('ไม่พบข้อมูลพนักงานที่ระบุ');
    }

    if (dto.employeeCode && dto.employeeCode !== employee.employeeCode) {
      const existingCode = await this.prisma.employee.findUnique({
        where: { employeeCode: dto.employeeCode },
      });
      if (existingCode) {
        throw new BadRequestException('รหัสพนักงานนี้ถูกใช้งานแล้วในระบบ');
      }
    }

    if (dto.email && dto.email !== employee.email) {
      const existingEmail = await this.prisma.employee.findUnique({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new BadRequestException('อีเมลพนักงานนี้ถูกใช้งานแล้วในระบบ');
      }
    }

    const updated = await this.prisma.employee.update({
      where: { id },
      data: dto,
    });

    await this.auditLogsService.log(
      actorId,
      'UPDATE_EMPLOYEE',
      'Employee',
      id,
      employee,
      updated,
    );
    return updated;
  }

  async remove(id: string, actorId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
    });
    if (!employee) {
      throw new NotFoundException('ไม่พบข้อมูลพนักงานที่ระบุ');
    }

    await this.prisma.employee.delete({
      where: { id },
    });

    await this.auditLogsService.log(
      actorId,
      'DELETE_EMPLOYEE',
      'Employee',
      id,
      employee,
      null,
    );
    return { success: true };
  }
}
