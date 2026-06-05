import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'อีเมลไม่ถูกต้อง' })
  @IsNotEmpty({ message: 'กรุณากรอกอีเมล' })
  email: string;

  @IsNotEmpty({ message: 'กรุณากรอกรหัสผ่าน' })
  @MinLength(6, { message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' })
  password: string;

  @IsNotEmpty({ message: 'กรุณากรอกชื่อ-นามสกุลสำหรับผู้ใช้งาน' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'กรุณากรอกรหัสพนักงาน' })
  @IsString()
  employeeCode: string;

  @IsNotEmpty({ message: 'กรุณากรอกชื่อจริง' })
  @IsString()
  firstName: string;

  @IsNotEmpty({ message: 'กรุณากรอกนามสกุล' })
  @IsString()
  lastName: string;

  @IsNotEmpty({ message: 'กรุณากรอกแผนก' })
  @IsString()
  department: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
