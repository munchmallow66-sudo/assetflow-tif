import { z } from 'zod';

// =================== Auth ===================

export const loginSchema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง').min(1, 'กรุณากรอกอีเมล'),
  password: z.string().min(6, 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร'),
});

export const registerSchema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง').min(1, 'กรุณากรอกอีเมล'),
  password: z.string().min(6, 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร'),
  name: z.string().min(1, 'กรุณากรอกชื่อ-นามสกุลสำหรับผู้ใช้งาน'),
  employeeCode: z.string().min(1, 'กรุณากรอกรหัสพนักงาน'),
  firstName: z.string().min(1, 'กรุณากรอกชื่อจริง'),
  lastName: z.string().min(1, 'กรุณากรอกนามสกุล'),
  department: z.string().min(1, 'กรุณากรอกแผนก'),
  phone: z.string().optional(),
});

// =================== Assets ===================

export const createAssetSchema = z.object({
  assetCode: z.string().min(1, 'กรุณากรอกรหัสสินทรัพย์'),
  name: z.string().min(1, 'กรุณากรอกชื่อสินทรัพย์'),
  category: z.string().min(1, 'กรุณากรอกหมวดหมู่'),
  serialNumber: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  cloudinaryPublicId: z.string().optional(),
  qrCode: z.string().min(1, 'กรุณากรอกรหัส QR Code ของสินทรัพย์'),
});

export const updateAssetSchema = z.object({
  assetCode: z.string().optional(),
  name: z.string().optional(),
  category: z.string().optional(),
  serialNumber: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['AVAILABLE', 'BORROWED', 'MAINTENANCE', 'LOST', 'RETIRED']).optional(),
  currentHolderId: z.string().optional(),
  imageUrl: z.string().optional(),
  cloudinaryPublicId: z.string().optional(),
  qrCode: z.string().optional(),
});

// =================== Employees ===================

export const createEmployeeSchema = z.object({
  employeeCode: z.string().min(1, 'กรุณากรอกรหัสพนักงาน'),
  firstName: z.string().min(1, 'กรุณากรอกชื่อจริง'),
  lastName: z.string().min(1, 'กรุณากรอกนามสกุล'),
  department: z.string().min(1, 'กรุณากรอกแผนก'),
  email: z.string().email('อีเมลไม่ถูกต้อง').min(1, 'กรุณากรอกอีเมล'),
  phone: z.string().optional(),
});

export const updateEmployeeSchema = z.object({
  employeeCode: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  department: z.string().optional(),
  email: z.string().email('อีเมลไม่ถูกต้อง').optional(),
  phone: z.string().optional(),
});

// =================== Users ===================

export const createUserSchema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง').min(1, 'กรุณากรอกอีเมล'),
  password: z.string().min(6, 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร'),
  name: z.string().min(1, 'กรุณากรอกชื่อ'),
  role: z.enum(['ADMIN', 'STAFF', 'APPROVER', 'VIEWER'], { message: 'บทบาทไม่ถูกต้อง' }),
  employeeId: z.string().optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง').optional(),
  password: z.string().min(6, 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร').optional(),
  name: z.string().optional(),
  role: z.enum(['ADMIN', 'STAFF', 'APPROVER', 'VIEWER'], { message: 'บทบาทไม่ถูกต้อง' }).optional(),
  employeeId: z.string().optional(),
});

// =================== Borrow Requests ===================

export const createBorrowRequestSchema = z.object({
  assetId: z.string().min(1, 'กรุณาระบุสินทรัพย์ที่ต้องการยืม'),
  borrowDate: z.string().min(1, 'กรุณาระบุวันที่ขอยืม'),
  expectedReturnDate: z.string().min(1, 'กรุณาระบุวันที่คาดว่าจะส่งคืน'),
  purpose: z.string().min(1, 'กรุณาระบุวัตถุประสงค์ในการยืม'),
  signature: z.string().optional(),
});

export const rejectRequestSchema = z.object({
  rejectedReason: z.string().min(1, 'กรุณาระบุเหตุผลที่ปฏิเสธคำขอ'),
});

// =================== Returns ===================

export const createReturnSchema = z.object({
  borrowRequestId: z.string().min(1, 'กรุณาระบุรหัสการขอยืมที่ต้องการคืน'),
  condition: z.enum(['NORMAL', 'DAMAGED', 'LOST', 'INCOMPLETE'], { message: 'ระบุสภาพสินทรัพย์ไม่ถูกต้อง' }),
  conditionNote: z.string().optional(),
  imageUrl: z.string().optional(),
  cloudinaryPublicId: z.string().optional(),
});

// =================== Settings ===================

export const systemSettingsSchema = z.object({
  companyNameTh: z.string().min(1, 'กรุณากรอกชื่อบริษัทภาษาไทย'),
  companyNameEn: z.string().min(1, 'กรุณากรอกชื่อบริษัทภาษาอังกฤษ'),
  businessType: z.string().min(1, 'กรุณากรอกประเภทธุรกิจ'),
  contactEmail: z.string().email('อีเมลติดต่อหลักไม่ถูกต้อง').min(1, 'กรุณากรอกอีเมลติดต่อหลัก'),
  maxBorrowDays: z.number().int().min(1, 'จำนวนวันต้องมากกว่า 0'),
  autoMaintenanceOnDamaged: z.boolean(),
});

// =================== Helper ===================

export function formatZodError(error: z.ZodError) {
  const messages = error.issues.map((e) => e.message);
  return { message: messages, statusCode: 400 };
}
