import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAssetDto {
  @IsNotEmpty({ message: 'กรุณากรอกรหัสสินทรัพย์' })
  @IsString()
  assetCode: string;

  @IsNotEmpty({ message: 'กรุณากรอกชื่อสินทรัพย์' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'กรุณากรอกหมวดหมู่' })
  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  cloudinaryPublicId?: string;

  @IsNotEmpty({ message: 'กรุณากรอกรหัส QR Code ของสินทรัพย์' })
  @IsString()
  qrCode: string;
}
