import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(
    private cloudinaryService: CloudinaryService,
    private auditLogsService: AuditLogsService,
  ) {}

  @Post('cloudinary')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: any, @CurrentUser() user: any) {
    if (!file) {
      throw new BadRequestException('กรุณาเลือกไฟล์รูปภาพที่ต้องการอัปโหลด');
    }
    const result = await this.cloudinaryService.uploadImage(file.buffer);

    await this.auditLogsService.log(
      user.sub,
      'UPLOAD_IMAGE',
      'Upload',
      result.public_id,
      null,
      { secure_url: result.secure_url, public_id: result.public_id },
    );

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }
}
