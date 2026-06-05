import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserDto {
  @IsEmail({}, { message: 'อีเมลไม่ถูกต้อง' })
  @IsOptional()
  email?: string;

  @MinLength(6, { message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' })
  @IsOptional()
  password?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsEnum(Role, { message: 'บทบาทไม่ถูกต้อง' })
  @IsOptional()
  role?: Role;

  @IsOptional()
  @IsString()
  employeeId?: string;
}
