import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  employeeCode?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsEmail({}, { message: 'อีเมลไม่ถูกต้อง' })
  @IsOptional()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
