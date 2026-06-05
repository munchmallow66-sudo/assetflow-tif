import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsEmail({}, { message: 'อีเมลไม่ถูกต้อง' })
  @IsNotEmpty({ message: 'กรุณากรอกอีเมล' })
  email: string;

  @IsNotEmpty({ message: 'กรุณากรอกรหัสผ่าน' })
  @MinLength(6, { message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' })
  password: string;

  @IsNotEmpty({ message: 'กรุณากรอกชื่อ' })
  @IsString()
  name: string;

  @IsEnum(Role, { message: 'บทบาทไม่ถูกต้อง' })
  role: Role;

  @IsOptional()
  @IsString()
  employeeId?: string;
}
