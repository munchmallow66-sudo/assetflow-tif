import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { ConditionStatus } from '@prisma/client';

export class CreateReturnDto {
  @IsNotEmpty({ message: 'กรุณาระบุรหัสการขอยืมที่ต้องการคืน' })
  @IsString()
  borrowRequestId: string;

  @IsNotEmpty({ message: 'กรุณาระบุสภาพสินทรัพย์ตอนส่งคืน' })
  @IsEnum(ConditionStatus, { message: 'ระบุสภาพสินทรัพย์ไม่ถูกต้อง' })
  condition: ConditionStatus;

  @IsOptional()
  @IsString()
  conditionNote?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  cloudinaryPublicId?: string;
}
