# Thai Inter Flying Asset Borrowing & Return System (ระบบยืม-คืนสินทรัพย์ภายใน)

ระบบสารสนเทศเพื่อการจัดการสินทรัพย์ การขอยืม การอนุมัติ และการส่งคืนครุภัณฑ์/อุปกรณ์ ของสถาบันการบิน **Thai Inter Flying** พัฒนาขึ้นด้วยสถาปัตยกรรมแบบ Full-stack แยกโปรเจกต์ Frontend (Next.js) และ Backend (NestJS) เพื่อรองรับการทำงานแยกส่วนและการขยายระบบในอนาคต

---

## 📂 โครงสร้างโฟลเดอร์ของโปรเจกต์ (Recommended Folder Structure)

```
thai-inter-flying-borrow-system/
├── backend/                  # NestJS API (Port: 4000)
│   ├── src/
│   │   ├── auth/             # การพิสูจน์ตัวตน (JWT), Guards & Decorators
│   │   ├── users/            # การจัดการบัญชีผู้ใช้งาน (Admin Only)
│   │   ├── employees/        # การจัดการข้อมูลพนักงาน
│   │   ├── assets/           # การจัดการสินทรัพย์, QR Code & ประวัติการใช้งาน
│   │   ├── borrow-requests/  # ระบบขอยืมครุภัณฑ์ การอนุมัติและการปฏิเสธ
│   │   ├── returns/          # ระบบรับคืน คัดแยกสถานะตามสภาพอุปกรณ์
│   │   ├── reports/          # รายงานสรุป สถิติแดชบอร์ด และประวัติ Timeline
│   │   ├── uploads/          # การจัดการไฟล์ร่วมกับ Cloudinary
│   │   ├── audit-logs/       # บันทึกประวัติกิจกรรมระบบ (Audit Log)
│   │   ├── prisma/           # Prisma service
│   │   ├── main.ts
│   │   └── app.module.ts
│   ├── prisma/
│   │   ├── schema.prisma     # Prisma database schema
│   │   └── seed.ts           # สคริปต์จำลองข้อมูลผู้ใช้ สินทรัพย์ และพนักงานเริ่มต้น
│   ├── .env                  # การตั้งค่า Environment Variables ฝั่ง Backend
│   └── package.json
└── frontend/                 # Next.js App Router Client (Port: 3000)
    ├── src/
    │   ├── app/              # หน้าแสดงผลหลัก (Thai UI Localization)
    │   │   ├── login/        # หน้าเข้าสู่ระบบและลงทะเบียนผู้ใช้งาน
    │   │   ├── dashboard/    # แดชบอร์ดสรุปสถิติจำนวนสินทรัพย์และทางลัดการทำรายการ
    │   │   ├── assets/       # ตารางรายการข้อมูลสินทรัพย์ ค้นหา และฟิลเตอร์ตัวกรอง
    │   │   ├── borrow/       # หน้าส่งคำขอยืมและรายการอนุมัติคำขอยืม
    │   │   ├── returns/      # หน้าประวัติการส่งคืนสินทรัพย์ทั้งหมด
    │   │   ├── reports/      # รายงานวิเคราะห์ค้างส่ง คืนซ่อม และประวัติแบบเจาะจง
    │   │   ├── users/        # การจัดการบัญชีผู้ใช้ระบบ (ADMIN)
    │   │   ├── employees/    # การจัดการพนักงาน (ADMIN)
    │   │   ├── settings/     # ข้อมูลองค์กรและข้อมูลทางเทคนิคของระบบ
    │   │   ├── layout.tsx
    │   │   └── page.tsx
    │   ├── components/
    │   │   ├── layout/       # ส่วนหน้ากาก Sidebar และ AppLayout ควบคุมสิทธิ์
    │   │   └── providers/    # Auth Context Provider ควบคุมสัญญาน JWT
    │   ├── hooks/            # Custom Hooks (useAuth)
    │   ├── lib/              # Axios API instance
    │   └── types/            # TypeScript type definitions
    ├── .env.local            # การตั้งค่า Environment Variables ฝั่ง Frontend
    └── package.json
```

---

## 🛠️ ขั้นตอนการติดตั้งและรันระบบ (Setup & Running Guide)

### 1. การติดตั้งในส่วนของ Backend (NestJS)

1. เข้าไปยังไดเรกทอรี `backend`:
   ```bash
   cd backend
   ```
2. ทำการติดตั้งโปรแกรมจำลองที่จำเป็น (หากยังไม่มี):
   ```bash
   npm install
   ```
3. สร้างและตั้งค่าไฟล์ `.env` ที่อยู่ในโฟลเดอร์ `backend/` โดยระบุค่าดังนี้:
   ```env
   DATABASE_URL="postgresql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DATABASE>?sslmode=require"
   JWT_SECRET="super-secret-jwt-key-thai-inter-flying-2026"
   JWT_EXPIRES_IN="1d"
   CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
   CLOUDINARY_API_KEY="your-cloudinary-api-key"
   CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
   FRONTEND_URL="http://localhost:3000"
   PORT=4000
   ```
4. ซิงก์ฐานข้อมูลและสร้างตารางด้วย Prisma:
   ```bash
   npx prisma migrate dev --name init
   ```
5. ทำการ Seed ข้อมูลผู้ใช้ทดสอบและอุปกรณ์เริ่มต้นเข้าสู่ฐานข้อมูล:
   ```bash
   npx prisma db seed
   ```
6. รันเซิร์ฟเวอร์ Backend ในโหมดพัฒนา:
   ```bash
   npm run start:dev
   ```

### 2. การติดตั้งในส่วนของ Frontend (Next.js)

1. เข้าไปยังไดเรกทอรี `frontend`:
   ```bash
   cd ../frontend
   ```
2. ติดตั้ง Dependencies:
   ```bash
   npm install
   ```
3. สร้างและตั้งค่าไฟล์ `.env.local` ในโฟลเดอร์ `frontend/`:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:4000"
   ```
4. รันเซิร์ฟเวอร์ Frontend ในโหมดพัฒนา:
   ```bash
   npm run dev
   ```
   *หมายเหตุ: เข้าถึงหน้าเว็บผ่าน [http://localhost:3000](http://localhost:3000)*

---

## 👤 บัญชีผู้ใช้งานสำหรับการทดสอบระบบ (Default Credentials)

สคริปต์ DB Seeder ทำการสร้างผู้ใช้งานจากรายชื่อพนักงานทั้งหมด โดยใช้รหัสผ่านเริ่มต้นร่วมกันดังนี้:

* **รหัสผ่านเข้าสู่ระบบสำหรับทุกบัญชี:** `TIF@2026`

คุณสามารถใช้บัญชีพนักงานตามบทบาท (Role) ที่ต้องการทดสอบดังนี้:

* **ADMIN (ผู้ดูแลระบบ):** `watchara.pho@tif.ac.th` (คุณเซฟ), `punpisut.nur@tif.ac.th` (คุณแม็ค), `panu.nim@tif.ac.th` (คุณหนึ่ง), `jarkarin.kun@tif.ac.th` (คุณหน่อย), `anchittha.khu@tif.ac.th` (คุณรุ้ง)
* **APPROVER (ผู้อนุมัติ):** `winai.kas@tif.ac.th` (คุณวินัย), `phat.pho@tif.ac.th` (คุณพัฒน์), `rapee.ujj@tif.ac.th` (คุณปุ๋ย), `suvicha.boo@tif.ac.th` (คุณแจ็ค) และคนอื่น ๆ ที่มีบทบาท APPROVER
* **STAFF (พนักงานทั่วไป/ผู้ยืม):** `soontorn.wut@tif.ac.th` (ครูสุน), `nirut.peh@tif.ac.th` (คุณรุทธ์) และพนักงานคนอื่น ๆ ทั้งหมดในรายชื่อ


---

## ⚙️ รายชื่อ APIs หลักบน NestJS Backend (Main API Endpoints)

### Auth Module
- `POST /auth/register` - ลงทะเบียนผู้ใช้งานระบบและข้อมูลพนักงาน
- `POST /auth/login` - เข้าสู่ระบบ รับ JWT access token คืนกลับมา
- `GET /auth/me` - ดึงโปรไฟล์และข้อมูลพนักงานของผู้ใช้งานปัจจุบัน

### Users Module (ADMIN Only)
- `GET /users` - รายการผู้ใช้งานทั้งหมด
- `GET /users/:id` - ดึงรายละเอียดผู้ใช้งานตาม ID
- `POST /users` - สร้างผู้ใช้งานใหม่
- `PATCH /users/:id` - แก้ไขผู้ใช้งาน
- `DELETE /users/:id` - ลบผู้ใช้งาน

### Employees Module (ADMIN / APPROVER)
- `GET /employees` - รายการพนักงานทั้งหมด
- `GET /employees/:id` - ดึงข้อมูลพนักงานตาม ID
- `POST /employees` - เพิ่มข้อมูลพนักงานใหม่ (ADMIN)
- `PATCH /employees/:id` - แก้ไขข้อมูลพนักงาน (ADMIN)
- `DELETE /employees/:id` - ลบข้อมูลพนักงาน (ADMIN)

### Assets Module
- `GET /assets` - ดูรายการสินทรัพย์ทั้งหมด (ทุกบทบาท)
- `GET /assets/:id` - รายละเอียดสินทรัพย์ (ทุกบทบาท)
- `POST /assets` - สร้างสินทรัพย์ใหม่ (ADMIN)
- `PATCH /assets/:id` - แก้ไขรายละเอียดและเปลี่ยนสถานะสินทรัพย์ (ADMIN)
- `DELETE /assets/:id` - ลบหรือเปลี่ยนสถานะสินทรัพย์เป็น RETIRED (ADMIN)
- `POST /assets/:id/upload-image` - อัปโหลดรูปภาพสินทรัพย์เข้า Cloudinary และเก็บลิงก์ (ADMIN)
- `GET /assets/:id/history` - เรียกดูไทม์ไลน์ประวัติการยืม-คืนของสินทรัพย์ชิ้นนั้น (ADMIN, STAFF, APPROVER)

### Borrow Requests Module
- `GET /borrow-requests` - รายการคำขอยืม (STAFF เห็นเฉพาะของตนเอง, บทบาทอื่นเห็นทั้งหมด)
- `GET /borrow-requests/:id` - ดูรายละเอียดคำขอยืม
- `POST /borrow-requests` - ส่งคำขอยืมสินทรัพย์ (STAFF, ADMIN) *ป้องกันการยืมสินทรัพย์ที่ไม่ว่าง*
- `PATCH /borrow-requests/:id/approve` - อนุมัติคำขอ (ADMIN, APPROVER) *เปลี่ยนสถานะสินค้าและคำขอพร้อมกัน*
- `PATCH /borrow-requests/:id/reject` - ปฏิเสธคำขอและระบุเหตุผล (ADMIN, APPROVER)
- `PATCH /borrow-requests/:id/cancel` - ยกเลิกคำขอที่ยังไม่ได้ถูกดำเนินการ (STAFF เฉพาะของตนเอง)

### Returns Module (ADMIN Only)
- `GET /returns` - รายการบันทึกการส่งคืนทั้งหมด
- `GET /returns/:id` - รายละเอียดบันทึกการส่งคืน
- `POST /returns` - บันทึกรับคืนสินทรัพย์พร้อมอัปโหลดรูปภาพหลักฐาน *คำนวณสถานะสินค้าอัตโนมัติตามสภาพการส่งคืน (NORMAL -> AVAILABLE, DAMAGED -> MAINTENANCE, LOST -> LOST)*

### Reports Module (ADMIN, APPROVER, VIEWER)
- `GET /reports/dashboard` - ดึงข้อมูลสถิติตัวเลขสรุปบนแดชบอร์ด
- `GET /reports/borrowed-assets` - รายการสินทรัพย์ที่อยู่ระหว่างการยืม
- `GET /reports/overdue-assets` - รายการสินทรัพย์เลยกำหนดส่งคืน
- `GET /reports/damaged-assets` - รายการสินทรัพย์ชำรุดจากการส่งคืน
- `GET /reports/employee-history/:employeeId` - ค้นหาประวัติการยืมของพนักงานที่เจาะจง
- `GET /reports/asset-history/:assetId` - ค้นหาประวัติการถูกใช้งานของสินทรัพย์ชิ้นที่เจาะจง

### Uploads Module
- `POST /uploads/cloudinary` - อัปโหลดภาพเข้าคลาวด์และรับ secure url และ public id คืน (ต้องได้รับสิทธิ์ JWT)

### Audit Logs Module (ADMIN Only)
- `GET /audit-logs` - ดึงข้อมูลประวัติกิจกรรมการทำรายการในระบบทั้งหมด

---

## 🚀 คำแนะนำสำหรับการขึ้นระบบขึ้นบลู (Deployment Instructions)

### 1. Database Setup (Neon PostgreSQL)
- สมัครใช้งาน Neon.tech และสร้างโครงการ PostgreSQL ใหม่
- คัดลอก Connection String ของฐานข้อมูลไปใส่ที่ฟิลด์ `DATABASE_URL` ในไฟล์ `.env` บน NestJS Backend

### 2. Backend (Render / Railway / Fly.io)
- นำโฟลเดอร์ `backend/` ไปเก็บแยกหรือจัดการ monorepo root
- ตั้งค่า Environment Variables ทั้งหมดที่ปรากฏอยู่ในหัวข้อ Backend Setup ในหน้า Setting ของเซิร์ฟเวอร์คลาวด์ที่ใช้ Deploy
- ตั้งค่า Build Command: `npm install && npm run build`
- ตั้งค่า Start Command: `node dist/main.js`

### 3. Frontend (Vercel)
- เชื่อมต่อบัญชี GitHub เข้ากับโครงการ Vercel
- เลือกโฟลเดอร์ Root: `frontend/`
- ในช่อง Environment Variables ตั้งค่า `NEXT_PUBLIC_API_URL` ให้ชี้ไปยัง Domain URL ของ API Backend ที่คุณเพิ่ง Deploy ขึ้น
- กด Deploy เพื่อสร้างโปรเจกต์เว็บแอปพลิเคชันฝั่งลูกข่าย
