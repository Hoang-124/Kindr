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

  return nodemailer.createTransport({
    host: host || 'smtp.gmail.com',
    port: port || 465,
    secure: (port === 465 || !port),
    auth: {
      user,
      pass: pass.replace(/\s+/g, ''),
    },
    // Force IPv4 to prevent cloud timeouts
    family: 4,
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  } as any);
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

/**
 * Send Waitlist Early-Bird Confirmation Email
 */
export async function sendWaitlistWelcomeEmail(
  toEmail: string,
  orderNumber: number,
  phone?: string,
  userRole?: string,
  interest?: string
): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const isGenz = userRole === 'genz' || userRole === 'relative';
  const roleName = isGenz ? 'Bạn / Người thân' : 'Mẹ bỉm sữa';
  const formattedCode = `#KD-${String(orderNumber).padStart(4, '0')}/200`;
  const subject = `[Kindr] Xác nhận đăng ký giữ chỗ thành công (${formattedCode})`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác nhận giữ chỗ Kindr</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2D2325; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FAF7F2; padding: 36px 12px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background-color: #FFFFFF; border-radius: 20px; border: 1px solid rgba(45, 35, 37, 0.08); box-shadow: 0 12px 36px rgba(45, 35, 37, 0.05); overflow: hidden;">
          
          <!-- Top Header Brand Navigation -->
          <tr>
            <td style="padding: 28px 32px 24px 32px; border-bottom: 1px solid rgba(45, 35, 37, 0.06); background-color: #FFFFFF;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <!-- Vector Logo -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <div style="width: 40px; height: 40px; border-radius: 50%; background: #EEF7F5; border: 1.5px solid rgba(43, 138, 126, 0.35); text-align: center; line-height: 40px;">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2B8A7E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block;">
                              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                            </svg>
                          </div>
                        </td>
                        <td style="vertical-align: middle;">
                          <div style="font-size: 22px; font-weight: 800; color: #2D2325; letter-spacing: -0.5px; line-height: 1.1;">Kindr</div>
                          <div style="font-size: 12px; font-weight: 600; color: #7A6C6F; letter-spacing: 0.2px; margin-top: 2px;">Cộng đồng Trao đổi Đồ Mẹ &amp; Bé • Đà Nẵng</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; background-color: #EEF7F5; border: 1px solid rgba(43, 138, 126, 0.25); color: #2B8A7E; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; padding: 5px 12px; border-radius: 999px;">
                      ĐÃ XÁC NHẬN
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Section -->
          <tr>
            <td style="padding: 32px 32px 28px 32px;">
              
              <!-- Greeting & Announcement -->
              <h2 style="margin: 0 0 14px 0; color: #2D2325; font-size: 22px; font-weight: 800; line-height: 1.3; letter-spacing: -0.02em;">
                Đăng ký nhận thông báo thành công
              </h2>
              
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #4A3E40;">
                Xin chào <strong>${roleName}</strong>,
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #4A3E40;">
                Cảm ơn bạn đã đăng ký nhận thông báo về ngày chính thức ra mắt của nền tảng <strong>Kindr</strong>. Hệ thống đã xác nhận giữ chỗ ưu đãi dành riêng cho bạn trong cộng đồng 200 thành viên tiên phong tại Đà Nẵng:
              </p>

              <!-- Digital Founding Member Pass (Artisanal Vector Pass) -->
              <div style="background: linear-gradient(135deg, #FFFBF5 0%, #FDF4E8 100%); border: 1.5px solid rgba(217, 119, 6, 0.28); border-radius: 16px; padding: 22px 24px; margin: 0 0 28px 0; box-shadow: 0 4px 18px rgba(217, 119, 6, 0.08);">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 14px;">
                  <tr>
                    <td style="vertical-align: middle;">
                      <span style="font-size: 11px; font-weight: 800; color: #B45309; letter-spacing: 0.8px; text-transform: uppercase;">
                        THẺ THÀNH VIÊN SÁNG LẬP • FOUNDING PASS
                      </span>
                    </td>
                    <td align="right" style="vertical-align: middle;">
                      <!-- Gold Vector Smart Chip -->
                      <svg width="26" height="18" viewBox="0 0 32 24" fill="none" style="vertical-align: middle; display: inline-block;">
                        <rect width="32" height="24" rx="4" fill="#D97706" fill-opacity="0.18" stroke="#D97706" stroke-width="1.4"/>
                        <path d="M0 8h32M0 16h32M11 0v24M21 0v24" stroke="#D97706" stroke-width="1.2" stroke-opacity="0.6"/>
                      </svg>
                    </td>
                  </tr>
                </table>

                <div style="font-size: 26px; font-weight: 900; color: #E05A36; letter-spacing: -0.02em; line-height: 1.1; margin-bottom: 8px;">
                  5 XU TIÊN PHONG
                </div>

                <div style="margin-bottom: 16px;">
                  <span style="display: inline-block; background-color: #FFFFFF; border: 1px solid rgba(217, 119, 6, 0.22); color: #92400E; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 999px;">
                    Tương đương 50.000 VNĐ chi tiêu khi ứng dụng mở cửa
                  </span>
                </div>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top: 1px solid rgba(217, 119, 6, 0.16); padding-top: 12px;">
                  <tr>
                    <td style="vertical-align: middle;">
                      <span style="font-family: monospace; font-size: 14px; font-weight: 800; color: #78350F; background: #FEF3C7; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.5px;">
                        ${formattedCode}
                      </span>
                    </td>
                    <td align="right" style="vertical-align: middle;">
                      <span style="font-size: 12px; font-weight: 600; color: #B45309;">
                        Bảo lưu số thứ tự ưu đãi vĩnh viễn
                      </span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Registration Details Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FAF7F2; border-radius: 12px; border: 1px solid rgba(45, 35, 37, 0.06); padding: 14px 18px; margin-bottom: 28px;">
                <tr>
                  <td style="font-size: 13px; color: #7A6C6F; padding: 6px 0; vertical-align: middle;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A6C6F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 6px; display: inline-block;">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    Hòm thư nhận thông báo:
                  </td>
                  <td style="font-size: 13px; font-weight: 700; color: #2D2325; text-align: right; padding: 6px 0;">${toEmail}</td>
                </tr>
                ${phone ? `
                <tr>
                  <td style="font-size: 13px; color: #7A6C6F; padding: 6px 0; vertical-align: middle;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A6C6F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 6px; display: inline-block;">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    Số điện thoại / Zalo:
                  </td>
                  <td style="font-size: 13px; font-weight: 700; color: #2D2325; text-align: right; padding: 6px 0;">${phone}</td>
                </tr>` : ''}
                ${interest ? `
                <tr>
                  <td style="font-size: 13px; color: #7A6C6F; padding: 6px 0; vertical-align: middle;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A6C6F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 6px; display: inline-block;">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    Món đồ mong muốn đổi:
                  </td>
                  <td style="font-size: 13px; font-weight: 700; color: #E05A36; text-align: right; padding: 6px 0;">${interest}</td>
                </tr>` : ''}
              </table>

              <!-- 3 Pillars of Safety (Designed as 3 Clean Cards with Pure Vector SVGs) -->
              <div style="font-size: 14px; font-weight: 800; color: #2D2325; letter-spacing: -0.01em; margin-bottom: 12px;">
                Cơ Chế Bảo Chứng An Tâm Khi Hoán Đổi:
              </div>

              <!-- Pillar 1 -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 10px; background-color: #FFFFFF; border: 1px solid rgba(45, 35, 37, 0.08); border-radius: 12px; padding: 12px 14px;">
                <tr>
                  <td style="width: 32px; vertical-align: top; padding-right: 10px;">
                    <div style="width: 28px; height: 28px; border-radius: 8px; background-color: #EEF7F5; text-align: center; line-height: 28px;">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2B8A7E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block;">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </div>
                  </td>
                  <td style="vertical-align: top;">
                    <div style="font-size: 13px; font-weight: 800; color: #2D2325; margin-bottom: 2px;">Ký Quỹ Song Phương (Double Escrow)</div>
                    <div style="font-size: 12px; line-height: 18px; color: #7A6C6F;">Người bán cọc trước 10% Xu cam kết mô tả trung thực — triệt tiêu 100% tình trạng ảnh mạng, hàng hư hỏng.</div>
                  </td>
                </tr>
              </table>

              <!-- Pillar 2 -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 10px; background-color: #FFFFFF; border: 1px solid rgba(45, 35, 37, 0.08); border-radius: 12px; padding: 12px 14px;">
                <tr>
                  <td style="width: 32px; vertical-align: top; padding-right: 10px;">
                    <div style="width: 28px; height: 28px; border-radius: 8px; background-color: #FDF0EB; text-align: center; line-height: 28px;">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E05A36" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block;">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                    </div>
                  </td>
                  <td style="vertical-align: top;">
                    <div style="font-size: 13px; font-weight: 800; color: #2D2325; margin-bottom: 2px;">Khung Giờ Vàng 6H (Safeful Time)</div>
                    <div style="font-size: 12px; line-height: 18px; color: #7A6C6F;">Mẹ mang đồ về phòng ngủ cho bé dùng thử 6 tiếng; hoàn toàn hài lòng mới bấm giải phóng Xu chuyển cho người trao đổi.</div>
                  </td>
                </tr>
              </table>

              <!-- Pillar 3 -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px; background-color: #FFFFFF; border: 1px solid rgba(45, 35, 37, 0.08); border-radius: 12px; padding: 12px 14px;">
                <tr>
                  <td style="width: 32px; vertical-align: top; padding-right: 10px;">
                    <div style="width: 28px; height: 28px; border-radius: 8px; background-color: #FEF3C7; text-align: center; line-height: 28px;">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block;">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                    </div>
                  </td>
                  <td style="vertical-align: top;">
                    <div style="font-size: 13px; font-weight: 800; color: #2D2325; margin-bottom: 2px;">Giao Nhận Siêu Cục Bộ &lt; 1km</div>
                    <div style="font-size: 12px; line-height: 18px; color: #7A6C6F;">Hẹn gặp ngay sảnh chung cư hoặc công viên tiện đường đưa đón con tại Đà Nẵng, không tốn phí ship cồng kềnh.</div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; line-height: 20px; color: #7A6C6F;">
                Chúng tôi sẽ gửi thư thông báo kèm liên kết tải ứng dụng (iOS &amp; Android) ngay trong đợt phát hành thử nghiệm đầu tiên.
              </p>
            </td>
          </tr>

          <!-- Clean Footer -->
          <tr>
            <td style="background-color: #FAF7F2; border-top: 1px solid rgba(45, 35, 37, 0.08); padding: 22px 32px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #7A6C6F;">
                © ${new Date().getFullYear()} Kindr Ecosystem — Đà Nẵng, Việt Nam.
              </p>
              <p style="margin: 0; font-size: 11px; color: #A39699; line-height: 16px;">
                Thư xác nhận đăng ký sớm từ nền tảng Kindr. Nếu có thắc mắc, vui lòng liên hệ <a href="mailto:support@kindr.vn" style="color: #E05A36; text-decoration: none; font-weight: 700;">support@kindr.vn</a>
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

  // 1. High-speed HTTPS API delivery (Port 443 - NEVER blocked by cloud firewalls like Render Free)
  const resendKey = process.env.RESEND_API_KEY || (ENV as any).RESEND_API_KEY;
  if (resendKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Kindr Ecosystem <onboarding@resend.dev>',
          to: [toEmail],
          subject,
          html: htmlContent,
        }),
      });
      const data: any = await response.json();
      if (response.ok) {
        console.log(`[EMAIL SERVICE] Resend HTTP email delivered to: ${toEmail} (${formattedCode})`);
        return { success: true };
      } else {
        console.warn(`[EMAIL SERVICE] Resend API error:`, data);
      }
    } catch (err: any) {
      console.error(`[EMAIL SERVICE] Resend fetch error:`, err?.message);
    }
  }

  // 2. Brevo HTTPS API (Port 443)
  const brevoKey = process.env.BREVO_API_KEY || (ENV as any).BREVO_API_KEY;
  if (brevoKey) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Kindr Ecosystem', email: 'ht20041975@gmail.com' },
          to: [{ email: toEmail }],
          subject,
          htmlContent,
        }),
      });
      if (response.ok) {
        console.log(`[EMAIL SERVICE] Brevo HTTP email delivered to: ${toEmail}`);
        return { success: true };
      }
    } catch (err: any) {
      console.error(`[EMAIL SERVICE] Brevo fetch error:`, err?.message);
    }
  }

  const transporter = createTransporter();

  if (transporter) {
    const sender = (process.env.SMTP_USER || ENV.SMTP_USER || '').trim();
    try {
      await transporter.sendMail({
        from: sender ? `"Kindr Ecosystem" <${sender}>` : (ENV.EMAIL_FROM || 'Kindr Ecosystem <ht20041975@gmail.com>'),
        to: toEmail,
        subject,
        text: `Xin chào ${roleName},\n\nCảm ơn bạn đã đăng ký nhận thông báo sớm của Kindr tại Đà Nẵng!\nSố thứ tự ưu đãi của bạn: ${formattedCode}.\nQuà tặng khởi động: 5 Xu Tiên Phong (tương đương 50.000 VNĐ) sẽ được kích hoạt vào ví tài khoản của bạn ngay khi ứng dụng chính thức ra mắt.\n\nTrân trọng,\nĐội ngũ Kindr Đà Nẵng`,
        html: htmlContent,
      });
      console.log(`[EMAIL SERVICE] Clean vector waitlist email sent to: ${toEmail} (${formattedCode})`);
      return { success: true };
    } catch (err: any) {
      console.error(`[EMAIL SERVICE] Error sending waitlist email to ${toEmail}:`, err);
      return {
        success: false,
        error: `Không thể gửi email đến ${toEmail}: ${err.message || 'Lỗi kết nối máy chủ mail.'}`,
      };
    }
  }

  console.warn(`[EMAIL SERVICE] SMTP not configured. Simulated sending waitlist email to ${toEmail}`);
  return { success: true, simulated: true };
}
