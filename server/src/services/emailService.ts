// server/src/services/emailService.ts
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { ENV } from '../config/env';

// Initialize transporter helper
function createTransporter() {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
  const user = (process.env.SMTP_USER || ENV.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || ENV.SMTP_PASS || '').trim();
  const host = (process.env.SMTP_HOST || ENV.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = parseInt(process.env.SMTP_PORT || `${ENV.SMTP_PORT}`, 10);

  if (!user || !pass) {
    return null;
  }

  // Use built-in Gmail service if using gmail.com
  if (host.includes('gmail.com') || user.includes('@gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass: pass.replace(/\s+/g, ''), // auto-remove spaces from Google App Password (e.g. "abcd efgh ijkl mnop")
      },
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Send Password Reset OTP Email
 */
export async function sendPasswordResetOtpEmail(
  toEmail: string,
  userName: string,
  otp: string
): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const subject = `[Kindr] Mã xác thực OTP khôi phục mật khẩu: ${otp}`;
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Khôi phục mật khẩu Kindr</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F7FBFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F7FBFA; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="560px" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #DDF2F1; box-shadow: 0 4px 20px rgba(10, 186, 181, 0.08); overflow: hidden;">
          <!-- Header with Tiffany Blue Accent -->
          <tr>
            <td style="background-color: #0ABAB5; padding: 32px 24px; text-align: center;">
              <div style="margin-bottom: 8px;">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block;">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h1 style="margin: 0; color: #FFFFFF; font-size: 26px; font-weight: 800; letter-spacing: 0.5px;">Kindr</h1>
              <p style="margin: 6px 0 0; color: #E6F8F7; font-size: 14px; font-weight: 500;">Cộng đồng Trao đổi Đồ Mẹ & Bé Văn Minh</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="margin: 0 0 16px; color: #0F172A; font-size: 20px; font-weight: 700;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0ABAB5" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -3px; margin-right: 8px; display: inline-block;">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Khôi phục mật khẩu
              </h2>
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 24px; color: #334155;">
                Xin chào <strong>${userName || 'Mẹ Bỉm'}</strong>,
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 24px; color: #334155;">
                Chúng tôi nhận được yêu cầu cấp lại mật khẩu cho tài khoản Kindr liên kết với email này. Vui lòng sử dụng mã OTP dưới đây để hoàn tất xác nhận mật khẩu mới:
              </p>

              <!-- OTP Code Display Card -->
              <div style="background-color: #E6F8F7; border: 2px dashed #0ABAB5; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #007A78; font-family: monospace;">${otp}</span>
                <p style="margin: 8px 0 0; font-size: 13px; color: #475569; font-weight: 500;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#007A78" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 5px; display: inline-block;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  Mã xác thực có hiệu lực trong <strong>10 phút</strong>
                </p>
              </div>

              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 6px; padding: 12px 16px; margin: 20px 0 8px;">
                <p style="margin: 0; font-size: 13px; line-height: 20px; color: #92400E;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -3px; margin-right: 6px; display: inline-block;">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <strong>Lưu ý bảo mật:</strong> Vui lòng không chia sẻ mã này cho bất kỳ ai, kể cả nhân viên hỗ trợ của Kindr. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc đổi mật khẩu ngay lập tức.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #F1F5F9; padding: 20px 28px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94A3B8;">
                © ${new Date().getFullYear()} Kindr Ecosystem. Mọi quyền được bảo lưu.
              </p>
              <p style="margin: 4px 0 0; font-size: 12px; color: #94A3B8;">
                Cần hỗ trợ? Liên hệ <a href="mailto:support@kindr.vn" style="color: #0ABAB5; text-decoration: none; font-weight: 600;">support@kindr.vn</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const transporter = createTransporter();

  // If real SMTP transporter is configured
  if (transporter) {
    const sender = (process.env.SMTP_USER || ENV.SMTP_USER || '').trim();
    try {
      await transporter.sendMail({
        from: ENV.EMAIL_FROM || `Kindr <${sender}>`,
        to: toEmail,
        subject,
        text: `Xin chào ${userName || 'Mẹ Bỉm'},\n\nMã xác thực OTP khôi phục mật khẩu Kindr của bạn là: ${otp}\n\nMã xác thực có hiệu lực trong 10 phút. Vì lý do bảo mật, vui lòng không chia sẻ mã này cho bất kỳ ai.`,
        html: htmlContent,
      });
      console.log(`[EMAIL SERVICE] OTP successfully sent to real email: ${toEmail}`);
      return { success: true };
    } catch (err: any) {
      console.error(`[EMAIL SERVICE] Error sending email via SMTP to ${toEmail}:`, err);
      return { 
        success: false, 
        error: `Không thể gửi email đến ${toEmail}: ${err.message || 'Lỗi kết nối máy chủ mail.'}` 
      };
    }
  }

  // If not configured, report error requiring SMTP configuration
  console.warn(`[EMAIL SERVICE] SMTP_USER or SMTP_PASS is missing in server/.env. Cannot send real email to ${toEmail}.`);
  console.log(`[EMAIL SERVICE OTP]: ${otp} for ${toEmail}`);
  return { 
    success: false, 
    error: 'Hệ thống chưa được thiết lập tài khoản gửi Email (SMTP). Vui lòng cấu hình SMTP_USER và SMTP_PASS trong file server/.env.' 
  };
}

/**
 * Send Account Activation OTP Email
 */
export async function sendAccountActivationOtpEmail(
  toEmail: string,
  userName: string,
  otp: string
): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const subject = `[Kindr] Mã xác thực kích hoạt tài khoản của bạn: ${otp}`;
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kích hoạt tài khoản Kindr</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F7FBFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F7FBFA; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="560px" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #DDF2F1; box-shadow: 0 4px 20px rgba(10, 186, 181, 0.08); overflow: hidden;">
          <!-- Header with Tiffany Blue Accent -->
          <tr>
            <td style="background-color: #0ABAB5; padding: 32px 24px; text-align: center;">
              <div style="margin-bottom: 8px;">
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block;">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <polyline points="16 11 18 13 22 9"></polyline>
                </svg>
              </div>
              <h1 style="margin: 0; color: #FFFFFF; font-size: 26px; font-weight: 800; letter-spacing: 0.5px;">Kindr</h1>
              <p style="margin: 6px 0 0; color: #E6F8F7; font-size: 14px; font-weight: 500;">Cộng đồng Trao đổi Đồ Mẹ & Bé Văn Minh</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="margin: 0 0 16px; color: #0F172A; font-size: 20px; font-weight: 700;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0ABAB5" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -3px; margin-right: 8px; display: inline-block;">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Kích hoạt tài khoản của bạn
              </h2>
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 24px; color: #334155;">
                Xin chào <strong>${userName || 'Mẹ Bỉm'}</strong>,
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 24px; color: #334155;">
                Cảm ơn bạn đã đăng ký tài khoản Kindr với địa chỉ email <strong>${toEmail}</strong>. Vui lòng nhập mã xác thực 6 chữ số dưới đây vào ứng dụng để kích hoạt tài khoản của bạn:
              </p>

              <!-- OTP Code Display Card -->
              <div style="background-color: #E6F8F7; border: 2px dashed #0ABAB5; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                <div style="font-size: 12px; font-weight: 700; color: #007A78; letter-spacing: 1px; margin-bottom: 6px; text-transform: uppercase;">
                  Mã kích hoạt tài khoản của bạn
                </div>
                <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #007A78; font-family: monospace;">${otp}</span>
                <p style="margin: 10px 0 0; font-size: 13px; color: #475569; font-weight: 500;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#007A78" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 5px; display: inline-block;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  Mã xác thực có hiệu lực trong <strong>24 giờ</strong>
                </p>
              </div>

              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 6px; padding: 12px 16px; margin: 20px 0 8px;">
                <p style="margin: 0; font-size: 13px; line-height: 20px; color: #92400E;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -3px; margin-right: 6px; display: inline-block;">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <strong>Lưu ý:</strong> Vui lòng không chia sẻ mã này cho bất kỳ ai. Nếu bạn không đăng ký tài khoản Kindr, bạn có thể yên tâm bỏ qua email này.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #F1F5F9; padding: 20px 28px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94A3B8;">
                © ${new Date().getFullYear()} Kindr Ecosystem. Mọi quyền được bảo lưu.
              </p>
              <p style="margin: 4px 0 0; font-size: 12px; color: #94A3B8;">
                Cần hỗ trợ? Liên hệ <a href="mailto:support@kindr.vn" style="color: #0ABAB5; text-decoration: none; font-weight: 600;">support@kindr.vn</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const transporter = createTransporter();

  if (transporter) {
    const sender = (process.env.SMTP_USER || ENV.SMTP_USER || '').trim();
    try {
      await transporter.sendMail({
        from: ENV.EMAIL_FROM || `Kindr <${sender}>`,
        to: toEmail,
        subject,
        text: `Xin chào ${userName || 'Mẹ Bỉm'},\n\nCảm ơn bạn đã đăng ký tài khoản Kindr với địa chỉ email ${toEmail}.\nMã xác thực kích hoạt tài khoản của bạn là: ${otp}\n\nMã xác thực có hiệu lực trong 24 giờ.`,
        html: htmlContent,
      });
      console.log(`[EMAIL SERVICE] Activation OTP successfully sent to real email: ${toEmail}`);
      return { success: true };
    } catch (err: any) {
      console.error(`[EMAIL SERVICE] Error sending activation email via SMTP to ${toEmail}:`, err);
      return { 
        success: false, 
        error: `Không thể gửi email kích hoạt đến ${toEmail}: ${err.message || 'Lỗi kết nối máy chủ mail.'}` 
      };
    }
  }

  return { 
    success: false, 
    error: 'Hệ thống chưa được thiết lập tài khoản gửi Email (SMTP). Vui lòng cấu hình SMTP_USER và SMTP_PASS trong file server/.env.' 
  };
}
