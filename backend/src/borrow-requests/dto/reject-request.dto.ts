import { IsNotEmpty, IsString } from 'class-validator';

export class RejectRequestDto {
  @IsNotEmpty({ message: 'กรุณาระบุเหตุผลที่ปฏิเสธคำขอ' })
  @IsString()
  rejectedReason: string;
}
