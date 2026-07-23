import nodemailer from 'nodemailer';

const DEFAULT_TARGET_EMAIL = 'watchara.pho@tif.ac.th';

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to?: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const recipient = to || process.env.NOTIFICATION_EMAIL || DEFAULT_TARGET_EMAIL;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `"TIF AssetFlow System" <no-reply@tif.ac.th>`;

  console.log(`[Email Service] Preparing email "${subject}" to ${recipient}`);

  // If SMTP user or pass is missing, log email details in development mode without crashing
  if (!user || !pass) {
    console.log(`[Email Service - Simulated Send]`);
    console.log(`To: ${recipient}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${text || html}`);
    return { success: true, simulated: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    const info = await transporter.sendMail({
      from,
      to: recipient,
      subject,
      text: text || html.replace(/<[^>]+>/g, ''),
      html,
    });

    console.log(`[Email Service] Sent email successfully! MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[Email Service Error] Failed to send email to ${recipient}:`, error);
    return { success: false, error: error.message };
  }
}

function formatDate(dateVal: Date | string | null | undefined): string {
  if (!dateVal) return '-';
  const date = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getBorrowerName(borrower?: any): string {
  if (!borrower) return '-';
  if (borrower.firstName || borrower.lastName) {
    return `${borrower.firstName || ''} ${borrower.lastName || ''}`.trim();
  }
  if (borrower.name) return borrower.name;
  return '-';
}

function getBorrowerCode(borrower?: any): string {
  if (!borrower) return '-';
  return borrower.employeeCode || borrower.employeeId || borrower.id || '-';
}

function emailWrapper(title: string, contentHtml: string): string {
  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); padding: 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 600; letter-spacing: 0.5px; }
        .body { padding: 28px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: bold; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-borrowed { background: #dbeafe; color: #1e40af; }
        .status-returned { background: #dcfce7; color: #166534; }
        .status-rejected { background: #fee2e2; color: #991b1b; }
        .footer { background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TIF AssetFlow Notification</h1>
        </div>
        <div class="body">
          ${contentHtml}
        </div>
        <div class="footer">
          <p>ระบบแจ้งเตือนอัตโนมัติ TIF AssetFlow - กรุณาอย่าตอบกลับอีเมลนี้</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// 1. Notification when a new Borrow Request is created
export async function sendBorrowRequestNotification(borrowRequest: {
  requestNo: string;
  borrower?: any;
  asset?: { assetCode?: string | null; name?: string | null };
  borrowDate: Date | string;
  expectedReturnDate: Date | string;
  purpose?: string | null;
}) {
  const subject = `[TIF AssetFlow] แจ้งเตือน: มีรายการขอยืมสินทรัพย์ใหม่ (${borrowRequest.requestNo})`;

  const html = emailWrapper(
    'มีรายการขอยืมสินทรัพย์ใหม่',
    `
      <h2 style="color: #1e3a8a; margin-top: 0;">📦 รายการขอยืมสินทรัพย์ใหม่</h2>
      <p style="color: #475569; font-size: 15px;">มีการส่งคำขอยืมสินทรัพย์เข้ามาในระบบ รายละเอียดดังนี้:</p>
      
      <div class="card">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">เลขที่คำขอ:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${borrowRequest.requestNo}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">ผู้ขอยืม:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${getBorrowerName(borrowRequest.borrower)} (${getBorrowerCode(borrowRequest.borrower)})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">สินทรัพย์:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${borrowRequest.asset?.name || '-'} [${borrowRequest.asset?.assetCode || '-'}]</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">วันที่ยืม:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${formatDate(borrowRequest.borrowDate)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">กำหนดคืน:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${formatDate(borrowRequest.expectedReturnDate)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">วัตถุประสงค์:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${borrowRequest.purpose || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">สถานะ:</td>
            <td style="padding: 6px 0; text-align: right;"><span class="status-badge status-pending">รออนุมัติ (PENDING)</span></td>
          </tr>
        </table>
      </div>
    `
  );

  return sendEmail({ subject, html });
}

// 2. Notification when an Asset Return is submitted
export async function sendReturnRequestNotification(returnRecord: {
  borrowRequest?: any;
  asset?: { assetCode?: string | null; name?: string | null } | null;
  condition?: string;
  conditionNote?: string | null;
  recordedBy?: { name?: string | null } | null;
}) {
  const requestNo = returnRecord.borrowRequest?.requestNo || '-';
  const borrower = returnRecord.borrowRequest?.borrower;
  const subject = `[TIF AssetFlow] แจ้งเตือน: มีการส่งคืนสินทรัพย์ (${requestNo})`;

  const html = emailWrapper(
    'มีการส่งคืนสินทรัพย์',
    `
      <h2 style="color: #166534; margin-top: 0;">🔄 มีการทำรายการคืนสินทรัพย์</h2>
      <p style="color: #475569; font-size: 15px;">มีการส่งคืนสินทรัพย์เข้าสู่ระบบ รายละเอียดดังนี้:</p>
      
      <div class="card">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">เลขที่คำขอ:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${requestNo}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">ผู้คืน/ผู้ยืม:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${getBorrowerName(borrower)} (${getBorrowerCode(borrower)})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">สินทรัพย์:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${returnRecord.asset?.name || '-'} [${returnRecord.asset?.assetCode || '-'}]</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">สภาพสินทรัพย์ที่คืน:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${returnRecord.condition || 'NORMAL'}</td>
          </tr>
          ${
            returnRecord.conditionNote
              ? `<tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 500;">หมายเหตุสภาพ:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${returnRecord.conditionNote}</td>
                </tr>`
              : ''
          }
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">วันที่ทำรายการ:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${formatDate(new Date())}</td>
          </tr>
        </table>
      </div>
    `
  );

  return sendEmail({ subject, html });
}

// 3. Notification when a Borrow Request status changes (Approve / Reject)
export async function sendBorrowStatusNotification(
  borrowRequest: {
    requestNo: string;
    borrower?: any;
    asset?: { assetCode?: string | null; name?: string | null };
    status: string;
    rejectedReason?: string | null;
  },
  actionType: 'APPROVED' | 'REJECTED'
) {
  const isApproved = actionType === 'APPROVED';
  const borrower = borrowRequest.borrower;
  const subject = `[TIF AssetFlow] แจ้งเตือน: ${
    isApproved ? 'อนุมัติการยืมสินทรัพย์' : 'ปฏิเสธคำขอยืมสินทรัพย์'
  } (${borrowRequest.requestNo})`;

  const html = emailWrapper(
    isApproved ? 'อนุมัติการยืมสินทรัพย์' : 'ปฏิเสธคำขอยืมสินทรัพย์',
    `
      <h2 style="color: ${isApproved ? '#1e40af' : '#991b1b'}; margin-top: 0;">
        ${isApproved ? '✅ อนุมัติการยืมสินทรัพย์เรียบร้อยแล้ว' : '❌ ปฏิเสธคำขอยืมสินทรัพย์'}
      </h2>
      <p style="color: #475569; font-size: 15px;">คำขอยืมสินทรัพย์ได้รับการประมวลผลแล้ว:</p>
      
      <div class="card">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">เลขที่คำขอ:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${borrowRequest.requestNo}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">ผู้ขอยืม:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${getBorrowerName(borrower)} (${getBorrowerCode(borrower)})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">สินทรัพย์:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${borrowRequest.asset?.name || '-'} [${borrowRequest.asset?.assetCode || '-'}]</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">สถานะใหม่:</td>
            <td style="padding: 6px 0; text-align: right;">
              <span class="status-badge ${isApproved ? 'status-borrowed' : 'status-rejected'}">
                ${isApproved ? 'ยืมอยู่ (BORROWED)' : 'ปฏิเสธ (REJECTED)'}
              </span>
            </td>
          </tr>
          ${
            !isApproved && borrowRequest.rejectedReason
              ? `<tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 500;">เหตุผลที่ปฏิเสธ:</td>
                  <td style="padding: 6px 0; color: #991b1b; font-weight: 600; text-align: right;">${borrowRequest.rejectedReason}</td>
                </tr>`
              : ''
          }
        </table>
      </div>
    `
  );

  return sendEmail({ subject, html });
}

// 4. Notification when a Return Status changes (Approve / Reject Return)
export async function sendReturnStatusNotification(
  borrowRequest: {
    requestNo: string;
    borrower?: any;
    asset?: { assetCode?: string | null; name?: string | null };
    status: string;
  },
  actionType: 'APPROVED_RETURN' | 'REJECTED_RETURN'
) {
  const isApproved = actionType === 'APPROVED_RETURN';
  const borrower = borrowRequest.borrower;
  const subject = `[TIF AssetFlow] แจ้งเตือน: ${
    isApproved ? 'อนุมัติการคืนสินทรัพย์' : 'ปฏิเสธการคืนสินทรัพย์'
  } (${borrowRequest.requestNo})`;

  const html = emailWrapper(
    isApproved ? 'อนุมัติการคืนสินทรัพย์' : 'ปฏิเสธการคืนสินทรัพย์',
    `
      <h2 style="color: ${isApproved ? '#166534' : '#991b1b'}; margin-top: 0;">
        ${isApproved ? '✅ อนุมัติการคืนสินทรัพย์เสร็จสมบูรณ์' : '❌ ปฏิเสธรายการคืนสินทรัพย์'}
      </h2>
      <p style="color: #475569; font-size: 15px;">การคืนสินทรัพย์ได้รับการตรวจสอบและประมวลผลแล้ว:</p>
      
      <div class="card">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">เลขที่คำขอ:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${borrowRequest.requestNo}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">ผู้คืน:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${getBorrowerName(borrower)} (${getBorrowerCode(borrower)})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">สินทรัพย์:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${borrowRequest.asset?.name || '-'} [${borrowRequest.asset?.assetCode || '-'}]</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">สถานะ:</td>
            <td style="padding: 6px 0; text-align: right;">
              <span class="status-badge ${isApproved ? 'status-returned' : 'status-borrowed'}">
                ${isApproved ? 'คืนเรียบร้อย (RETURNED)' : 'ปฏิเสธการคืน (REVERTED)'}
              </span>
            </td>
          </tr>
        </table>
      </div>
    `
  );

  return sendEmail({ subject, html });
}
