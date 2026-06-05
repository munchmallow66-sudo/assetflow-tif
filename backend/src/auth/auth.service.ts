import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if email already exists in User
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new BadRequestException('อีเมลนี้ถูกใช้งานแล้วในระบบ');
    }

    // Check if employee code or email exists
    const existingEmployee = await this.prisma.employee.findUnique({
      where: { employeeCode: dto.employeeCode },
    });
    if (existingEmployee) {
      throw new BadRequestException('รหัสพนักงานนี้ถูกใช้งานแล้วในระบบ');
    }

    const existingEmployeeEmail = await this.prisma.employee.findUnique({
      where: { email: dto.email },
    });
    if (existingEmployeeEmail) {
      throw new BadRequestException('อีเมลพนักงานนี้ถูกใช้งานแล้วในระบบ');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create Employee and User in a transaction
    return this.prisma.$transaction(async (tx) => {
      const employee = await tx.employee.create({
        data: {
          employeeCode: dto.employeeCode,
          firstName: dto.firstName,
          lastName: dto.lastName,
          department: dto.department,
          email: dto.email,
          phone: dto.phone,
        },
      });

      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          name: dto.name,
          role: Role.STAFF, // Default registered user role is STAFF
          employeeId: employee.id,
        },
      });

      // Log action in audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'REGISTER',
          entityType: 'User',
          entityId: user.id,
          newData: {
            email: user.email,
            name: user.name,
            role: user.role,
          } as any,
        },
      });

      const { password, ...result } = user;
      return result;
    });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { employee: true },
    });

    if (!user) {
      throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    // Create Audit Log for Login
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
      },
    });

    const { password, ...result } = user;
    return {
      accessToken,
      user: result,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { employee: true },
    });

    if (!user) {
      throw new UnauthorizedException('ไม่พบข้อมูลผู้ใช้งาน');
    }

    const { password, ...result } = user;
    return result;
  }
}
