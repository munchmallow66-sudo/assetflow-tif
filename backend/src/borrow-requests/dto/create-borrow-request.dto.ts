import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class CreateBorrowRequestDto {
  @IsNotEmpty({ message: 'กรุณาระบุสินทรัพย์ที่ต้องการยืม' })
  @IsString()
  assetId: string;

  @IsNotEmpty({ message: 'กรุณาระบุวันที่ขอยืม' })
  @IsDateString({}, { message: 'รูปแบบวันที่ขอยืมไม่ถูกต้อง' })
  borrowDate: string;

  @IsNotEmpty({ message: 'กรุณาระบุวันที่คาดว่าจะส่งคืน' })
  @IsDateString({}, { message: 'รูปแบบวันที่คาดว่าจะส่งคืนไม่ถูกต้อง' })
  expectedReturnDate: string;

  @IsNotEmpty({ message: 'กรุณาระบุวัตถุประสงค์ในการยืม' })
  @IsString()
  purpose: string;
}
