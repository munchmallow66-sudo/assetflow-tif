import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEmployeeDto {
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

  @IsEmail({}, { message: 'อีเมลไม่ถูกต้อง' })
  @IsNotEmpty({ message: 'กรุณากรอกอีเมล' })
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
