// api/waitlist.js - Vercel Serverless Function
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://kindradmin:KindrPass2026@cluster0.vdazcdf.mongodb.net/kindr?retryWrites=true&w=majority&appName=Cluster0';
const SMTP_USER = process.env.SMTP_USER || 'ht20041975@gmail.com';
const SMTP_PASS = (process.env.SMTP_PASS || 'rdgsrjdfadbfugqx').replace(/\s+/g, '');
const EMAIL_FROM = process.env.EMAIL_FROM || '"Kindr Ecosystem" <ht20041975@gmail.com>';

// MongoDB Schema
const WaitlistSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, default: '' },
  userRole: { type: String, default: 'mother' },
  interest: { type: String, default: 'Đồ chơi vận động' },
  ip: { type: String, default: '' },
  utmSource: { type: String, default: 'direct' },
  utmMedium: { type: String, default: 'web' },
  utmCampaign: { type: String, default: 'mvp_launch' },
  orderNumber: { type: Number, required: true },
}, { timestamps: true });

let WaitlistModel;
try {
  WaitlistModel = mongoose.model('Waitlist');
} catch {
  WaitlistModel = mongoose.model('Waitlist', WaitlistSchema);
}

// Cached MongoDB Connection for Serverless Execution
let isConnected = false;
async function connectDb() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGO_URI, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 6000,
  });
  isConnected = true;
}

// Nodemailer Transporter
function getTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    family: 4,
    connectionTimeout: 8000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });
}

function generateEmailHtml(formattedCode, roleName, toEmail, phone, interest) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chào Mừng Mẹ Tiên Phong Kindr Đà Nẵng</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F5F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #2D2325;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8F5F0; padding: 28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(45, 35, 37, 0.07); border: 1px solid rgba(45, 35, 37, 0.06);">
          <tr>
            <td style="padding: 24px 28px 16px; border-bottom: 1px solid #F0ECE4;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="display: inline-block; vertical-align: middle;">
                      <span style="font-size: 22px; font-weight: 800; color: #2D2325; letter-spacing: -0.02em;">Kindr</span>
                      <span style="display: inline-block; margin-left: 8px; font-size: 11px; font-weight: 700; color: #E05A36; background-color: #FDF2EF; padding: 2px 8px; border-radius: 99px; text-transform: uppercase;">Early Pilot Đà Nẵng</span>
                    </div>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="font-size: 11px; color: #7A6C6F; font-weight: 600;">#KD-${formattedCode}/200</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 28px 28px 20px;">
              <div style="display: inline-block; background-color: #FDF2EF; color: #E05A36; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 99px; margin-bottom: 12px;">
                Xác Nhận Giữ Chỗ Thành Công
              </div>
              <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 800; color: #2D2325; line-height: 1.25; letter-spacing: -0.02em;">
                Chào mừng ${roleName} đến với cộng đồng Kindr!
              </h1>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 22px; color: #5A4C4F;">
                Cảm ơn bạn đã tham gia mạng lưới phụ huynh văn minh tiên phong tại Đà Nẵng. Suất nhận gói khởi động <strong>5 Xu Tiên Phong (50.000đ)</strong> của bạn đã được khóa bảo lưu thành công!
              </p>

              <div style="background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%); border: 1.5px solid #F59E0B; border-radius: 14px; padding: 18px 20px; margin-bottom: 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="vertical-align: middle;">
                      <div style="font-size: 11px; font-weight: 700; color: #B45309; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Số Thứ Tự Ưu Đãi Của Bạn</div>
                      <div style="font-size: 26px; font-weight: 900; color: #92400E; letter-spacing: -0.02em;">Thành Viên #${formattedCode}</div>
                    </td>
                    <td align="right" style="vertical-align: middle;">
                      <div style="background-color: #B45309; color: #FFFFFF; font-size: 13px; font-weight: 800; padding: 6px 14px; border-radius: 8px;">
                        Tặng 5 Xu
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FAF7F2; border-radius: 12px; border: 1px solid rgba(45, 35, 37, 0.06); padding: 14px 18px; margin-bottom: 24px;">
                <tr>
                  <td style="font-size: 13px; color: #7A6C6F; padding: 4px 0;">Hòm thư nhận thông báo:</td>
                  <td style="font-size: 13px; font-weight: 700; color: #2D2325; text-align: right; padding: 4px 0;">${toEmail}</td>
                </tr>
                ${phone ? `<tr>
                  <td style="font-size: 13px; color: #7A6C6F; padding: 4px 0;">Số điện thoại / Zalo:</td>
                  <td style="font-size: 13px; font-weight: 700; color: #2D2325; text-align: right; padding: 4px 0;">${phone}</td>
                </tr>` : ''}
                ${interest ? `<tr>
                  <td style="font-size: 13px; color: #7A6C6F; padding: 4px 0;">Món đồ quan tâm:</td>
                  <td style="font-size: 13px; font-weight: 700; color: #E05A36; text-align: right; padding: 4px 0;">${interest}</td>
                </tr>` : ''}
              </table>

              <div style="background-color: #F8F5F0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                <div style="font-size: 13px; font-weight: 800; color: #2D2325; margin-bottom: 6px;">3 Cam Kết An Toàn Từ Kindr:</div>
                <div style="font-size: 12px; line-height: 18px; color: #5A4C4F; margin-bottom: 4px;">• <strong>Ký quỹ kép Double Escrow:</strong> 100% Xu được bảo chứng an toàn.</div>
                <div style="font-size: 12px; line-height: 18px; color: #5A4C4F; margin-bottom: 4px;">• <strong>6 Giờ Safeful Time:</strong> Bé dùng thử êm ái trước khi giải ngân Xu.</div>
                <div style="font-size: 12px; line-height: 18px; color: #5A4C4F;">• <strong>Đổi đồ siêu cục bộ:</strong> Gặp gỡ phụ huynh cùng khu phố Đà Nẵng.</div>
              </div>

              <p style="margin: 0; font-size: 13px; color: #7A6C6F; line-height: 20px;">
                Kindr sẽ gửi link truy cập ứng dụng sớm nhất qua email này. Hẹn gặp lại bạn tại cộng đồng Kindr Đà Nẵng!
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 16px 28px; background-color: #FAF7F2; border-top: 1px solid #F0ECE4; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #A09295;">
                Kindr Đà Nẵng — Nền Tảng Hoán Đổi Đồ Mẹ &amp; Bé Siêu Cục Bộ | Ký Quỹ Double Escrow
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDb();

    // 1. GET: Return Stats
    if (req.method === 'GET') {
      const realCount = await WaitlistModel.countDocuments({});
      const total = realCount; // Starts at 0, increases per real registration
      const target = 200;
      const remaining = Math.max(0, target - total);
      const percentage = Math.min(100, Math.round((total / target) * 100));

      return res.status(200).json({
        total,
        target,
        remaining,
        percentage,
        realCount,
        data: { total, target, remaining, percentage, realCount }
      });
    }

    // 2. POST: Register Member & Dispatch Confirmation Email
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const email = (body.email || '').trim().toLowerCase();
      const phone = (body.phone || '').trim().replace(/[\s.-]/g, '');
      const userRole = body.userRole || 'mother';
      const interest = body.interest || 'Đồ chơi vận động';
      const clientIp = (req.headers && req.headers['x-forwarded-for']) || (req.socket && req.socket.remoteAddress) || '';

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        return res.status(400).json({ success: false, error: 'Địa chỉ email không đúng định dạng.' });
      }

      // Check if already registered
      let existing = await WaitlistModel.findOne({ email });
      let orderNum;
      let alreadyRegistered = false;

      if (existing) {
        orderNum = existing.orderNumber;
        alreadyRegistered = true;
      } else {
        const count = await WaitlistModel.countDocuments({});
        orderNum = count + 1;

        await WaitlistModel.create({
          email,
          phone,
          userRole,
          interest,
          ip: clientIp,
          utmSource: body.utmSource || 'landing_compact',
          utmMedium: body.utmMedium || 'web',
          utmCampaign: body.utmCampaign || 'pilot_danang',
          orderNumber: orderNum,
        });
      }

      // Calculate new community stats
      const totalCount = await WaitlistModel.countDocuments({});
      const target = 200;
      const remaining = Math.max(0, target - totalCount);
      const percentage = Math.min(100, Math.round((totalCount / target) * 100));
      const formattedCode = String(orderNum).padStart(4, '0');
      const roleName = userRole === 'genz' ? 'bạn' : 'Mẹ';

      // Send Confirmation Email via Port 465 SSL (open & supported on Vercel)
      let emailSent = false;
      let emailError = null;

      try {
        const transporter = getTransporter();
        const htmlContent = generateEmailHtml(formattedCode, roleName, email, phone, interest);

        await transporter.sendMail({
          from: EMAIL_FROM,
          to: email,
          subject: `[Kindr] Xác nhận đăng ký giữ chỗ #${formattedCode} — Nhận 5 Xu Tiên Phong`,
          text: `Xin chào ${roleName},\n\nCảm ơn bạn đã đăng ký nhận thông báo sớm của Kindr tại Đà Nẵng!\nSố thứ tự ưu đãi của bạn: #${formattedCode}.\nQuà tặng khởi động: 5 Xu Tiên Phong (50.000 VNĐ) sẽ được kích hoạt vào ví tài khoản của bạn ngay khi ứng dụng chính thức ra mắt.\n\nTrân trọng,\nĐội ngũ Kindr Đà Nẵng`,
          html: htmlContent,
        });
        emailSent = true;
        console.log(`[VERCEL API] Email successfully delivered to: ${email} (#${formattedCode})`);
      } catch (mailErr) {
        emailError = mailErr.message;
        console.error('[VERCEL API] Email dispatch error:', mailErr);
      }

      return res.status(alreadyRegistered ? 200 : 201).json({
        success: true,
        alreadyRegistered,
        emailSent,
        emailError,
        orderNumber: orderNum,
        total: totalCount,
        target,
        remaining,
        percentage,
        message: alreadyRegistered
          ? `Mẹ/bạn đã đăng ký giữ chỗ trước đó rồi nhé! Số thứ tự ưu đãi là #${orderNum}. Thư xác nhận đã được gửi đến email ${email}.`
          : `Chúc mừng mẹ/bạn! Đã giữ chỗ thành công thành viên thứ #${orderNum} nhận 5 Xu Tiên Phong. Thư xác nhận đã được gửi đến email ${email}!`,
        data: {
          orderNumber: orderNum,
          total: totalCount,
          target,
          remaining,
          percentage,
        }
      });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('[VERCEL API] Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Lỗi xử lý hệ thống.' });
  }
};
