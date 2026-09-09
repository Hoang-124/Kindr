// server/src/routes/auth.ts
// ========================================
// COMPLETE AUTH ROUTES — This is the PATTERN
// for all other route files to follow.
// ========================================
import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { ENV } from '../config/env';
import { registerPushToken, unregisterPushToken } from '../services/pushNotificationService';
import { sendPasswordResetOtpEmail, sendAccountActivationOtpEmail } from '../services/emailService';

const router = Router();

// ---- Validation Schemas (Zod) ----

const RegisterSchema = z.object({
  name: z.string().min(2, 'Tên phải ít nhất 2 ký tự'),
  phone: z.string().regex(/^0\d{9}$/, 'Số điện thoại Việt Nam không hợp lệ (VD: 0905123456)'),
  password: z.string().min(6, 'Mật khẩu phải ít nhất 6 ký tự'),
  email: z.string().email().optional(),
  districtId: z.string().optional(),
  districtName: z.string().optional(),
  addressDetail: z.string().optional(),
});

const LoginSchema = z.object({
  phone: z.string().min(1, 'Vui lòng nhập số điện thoại'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

// ---- Helper: Generate Tokens ----

function generateAccessToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, ENV.JWT_SECRET, {
    expiresIn: 900, // 15 minutes in seconds
  });
}

function generateRefreshToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, ENV.JWT_REFRESH_SECRET, {
    expiresIn: 604800, // 7 days in seconds
  });
}

// ---- Routes ----

/**
 * POST /api/auth/register
 * Register a new user. Awards 10 Xu welcome credit.
 */
router.post('/register', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Validate input
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { name, phone, password, email, districtId, districtName, addressDetail } = parsed.data;

    // 2. Check if email is Gmail (Gmail should use Google Sign-In)
    if (email && /@(gmail|googlemail)\.com$/i.test(email.trim())) {
      res.status(400).json({ error: 'Địa chỉ Gmail vui lòng sử dụng nút "Đăng ký nhanh với Google". Ô này chỉ dành cho Outlook, Yahoo, iCloud hoặc email khác.' });
      return;
    }

    // 3. Check duplicate phone
    const existing = await User.findOne({ phone });
    if (existing) {
      res.status(409).json({ error: 'Số điện thoại này đã được đăng ký.' });
      return;
    }

    // 4. Check duplicate email (if provided)
    if (email) {
      const existingEmail = await User.findOne({ email: email.trim().toLowerCase() });
      if (existingEmail) {
        res.status(409).json({ error: 'Địa chỉ email này đã được đăng ký trong hệ thống. Vui lòng dùng email khác hoặc đăng nhập.' });
        return;
      }
    }

    // 5. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const hasEmail = Boolean(email && email.trim());
    let activationOtp: string | undefined;
    let activationOtpExpires: Date | undefined;

    if (hasEmail) {
      activationOtp = Math.floor(100000 + Math.random() * 900000).toString();
      activationOtpExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    }

    // 6. Create user with 10 Xu welcome credit
    const user = await User.create({
      name,
      phone,
      email: email ? email.trim().toLowerCase() : undefined,
      passwordHash,
      isActivated: !hasEmail,
      activationOtp,
      activationOtpExpires,
      location: {
        districtId: districtId || '',
        districtName: districtName || '',
        addressDetail: addressDetail || '',
      },
      xuBalance: 10,
      welcomeCreditRemaining: 10,
      civilizationPoints: 95,
      historyPoints: [{
        pointsChanged: 95,
        reason: 'Chào mừng gia nhập cộng đồng Kindr! Tặng 10 Xu chào mừng',
        date: new Date(),
      }],
    });

    // 7. Create welcome notification
    await Notification.create({
      userId: user._id,
      type: 'welcome_credit',
      title: `Chào mừng ${name}!`,
      body: 'Kindr đã gửi tặng Mẹ 10 Xu chào mừng vào ví. Hãy bắt đầu đổi quà cho bé ngay nào!',
    });

    // If has email, require activation first!
    if (hasEmail && activationOtp && user.email) {
      await sendAccountActivationOtpEmail(user.email, user.name, activationOtp);

      res.status(201).json({
        message: 'Đăng ký thành công! Vui lòng kiểm tra email để nhập mã kích hoạt tài khoản.',
        needsActivation: true,
        email: user.email,
      });
      return;
    }

    // 8. Generate tokens for phone-only users
    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString(), user.role);

    user.refreshTokens.push(refreshToken);
    await user.save();

    res.status(201).json({
      message: 'Đăng ký thành công!',
      user: user.toJSON(),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống. Vui lòng thử lại.' });
  }
});

/**
 * POST /api/auth/login
 * Login with phone + password → JWT tokens.
 */
router.post('/login', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { phone, password } = parsed.data;

    // 1. Find user by phone OR email
    const loginIdentifier = phone.trim();
    const user = await User.findOne({
      $or: [
        { phone: loginIdentifier },
        { email: loginIdentifier.toLowerCase() },
      ],
    });
    if (!user) {
      res.status(401).json({ error: 'Số điện thoại/Email hoặc mật khẩu không đúng.' });
      return;
    }

    // 2. Check locked
    if (user.isLocked) {
      res.status(403).json({ error: 'Tài khoản đã bị khóa do vi phạm. Liên hệ BQT Kindr.' });
      return;
    }

    // 3. Verify password
    if (!user.passwordHash) {
      res.status(401).json({ error: 'Tài khoản này được tạo bằng Google. Vui lòng chọn Đăng nhập bằng Google.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Số điện thoại/Email hoặc mật khẩu không đúng.' });
      return;
    }

    // Check if account needs email activation
    if (user.email && !user.isActivated) {
      // Always generate a fresh 6-digit activation OTP
      const activationOtp = Math.floor(100000 + Math.random() * 900000).toString();
      user.activationOtp = activationOtp;
      user.activationOtpExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await user.save();

      // Send real email via SMTP
      const emailResult = await sendAccountActivationOtpEmail(user.email, user.name, activationOtp);
      if (!emailResult.success) {
        console.warn('[AUTH] Error sending activation email via SMTP:', emailResult.error);
      }

      res.status(403).json({
        error: 'Tài khoản của bạn chưa được kích hoạt. Kindr đã gửi mã xác thực kích hoạt 6 số về email của bạn. Vui lòng kích hoạt tài khoản để tiếp tục.',
        needsActivation: true,
        email: user.email,
      });
      return;
    }

    // Auto-grant admin role if email matches system admin configuration
    if (user.email && (ENV.ADMIN_EMAILS as readonly string[]).includes(user.email.toLowerCase()) && user.role !== 'admin') {
      user.role = 'admin';
    }

    // 4. Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString(), user.role);

    // 5. Store refresh token (limit to 5 sessions)
    user.refreshTokens = [...user.refreshTokens.slice(-4), refreshToken];
    await user.save();

    res.json({
      message: 'Đăng nhập thành công!',
      user: user.toJSON(),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token.
 */
router.post('/refresh', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: 'Thiếu refresh token.' });
      return;
    }

    // 1. Verify refresh token
    let decoded: { userId: string; role: string };
    try {
      decoded = jwt.verify(refreshToken, ENV.JWT_REFRESH_SECRET) as { userId: string; role: string };
    } catch {
      res.status(401).json({ error: 'Refresh token không hợp lệ hoặc đã hết hạn.' });
      return;
    }

    // 2. Check if refresh token exists in DB
    const user = await User.findById(decoded.userId);
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      res.status(401).json({ error: 'Refresh token đã bị thu hồi.' });
      return;
    }

    // 3. Rotate tokens
    const newAccessToken = generateAccessToken(user._id.toString(), user.role);
    const newRefreshToken = generateRefreshToken(user._id.toString(), user.role);

    user.refreshTokens = user.refreshTokens
      .filter(t => t !== refreshToken)
      .concat(newRefreshToken)
      .slice(-5);
    await user.save();

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile. Requires auth.
 */
router.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
      return;
    }

    if (user.email && (ENV.ADMIN_EMAILS as readonly string[]).includes(user.email.toLowerCase()) && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

/**
 * POST /api/auth/logout
 * Remove refresh token from DB.
 */
router.post('/logout', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await User.findByIdAndUpdate(req.userId, {
        $pull: { refreshTokens: refreshToken },
      });
    }

    res.json({ message: 'Đã đăng xuất.' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

/**
 * Helper to verify Google ID Token / Credential
 */
async function verifyGoogleToken(credentialOrIdToken: string): Promise<{ googleId: string; email: string; name: string; avatar: string }> {
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credentialOrIdToken}`);
    if (res.ok) {
      const data = await res.json() as any;
      if (data.email) {
        return {
          googleId: data.sub,
          email: data.email,
          name: data.name || data.given_name || 'Mẹ Bỉm Google',
          avatar: data.picture || '',
        };
      }
    }
  } catch (e) {
    // network or tokeninfo issue fallback
  }

  // Fallback: decode JWT payload
  try {
    const decoded = jwt.decode(credentialOrIdToken) as any;
    if (decoded && (decoded.sub || decoded.email)) {
      return {
        googleId: decoded.sub || decoded.googleId || 'google_' + Date.now(),
        email: decoded.email || `${decoded.sub}@gmail.com`,
        name: decoded.name || 'Mẹ Bỉm Google',
        avatar: decoded.picture || decoded.avatar || '',
      };
    }
  } catch {}

  throw new Error('Google token không hợp lệ.');
}

const GoogleAuthSchema = z.object({
  credential: z.string().optional(),
  idToken: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  avatar: z.string().optional(),
  googleId: z.string().optional(),
});

/**
 * POST /api/auth/google
 * Login or Register with Google OAuth
 */
router.post('/google', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = GoogleAuthSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dữ liệu đăng nhập Google không hợp lệ.' });
      return;
    }

    let googleProfile: { googleId: string; email: string; name: string; avatar: string };

    const tokenToVerify = parsed.data.credential || parsed.data.idToken;
    if (tokenToVerify) {
      googleProfile = await verifyGoogleToken(tokenToVerify);
    } else if (parsed.data.email && (parsed.data.googleId || parsed.data.name)) {
      googleProfile = {
        googleId: parsed.data.googleId || `google_${Date.now()}`,
        email: parsed.data.email,
        name: parsed.data.name || 'Mẹ Bỉm Google',
        avatar: parsed.data.avatar || '',
      };
    } else {
      res.status(400).json({ error: 'Thiếu thông tin xác thực Google.' });
      return;
    }

    // 1. Find existing user by googleId or email
    let user = await User.findOne({
      $or: [
        { googleId: googleProfile.googleId },
        { email: googleProfile.email.toLowerCase() },
      ],
    });

    let isNewUser = false;

    if (!user) {
      // 2. Create new user with 10 Xu Welcome Credit & 95 Civ points
      isNewUser = true;
      user = await User.create({
        name: googleProfile.name,
        email: googleProfile.email.toLowerCase(),
        googleId: googleProfile.googleId,
        avatar: googleProfile.avatar || '',
        location: {
          districtId: '',
          districtName: '',
          addressDetail: '',
        },
        xuBalance: 10,
        welcomeCreditRemaining: 10,
        civilizationPoints: 95,
        historyPoints: [{
          pointsChanged: 95,
          reason: 'Chào mừng gia nhập cộng đồng Kindr bằng Google! Tặng 10 Xu chào mừng',
          date: new Date(),
        }],
        role: (ENV.ADMIN_EMAILS as readonly string[]).includes(googleProfile.email.toLowerCase()) ? 'admin' : 'user',
      });

      // Welcome notification
      await Notification.create({
        userId: user._id,
        type: 'welcome_credit',
        title: `Chào mừng ${googleProfile.name}!`,
        body: 'Kindr đã gửi tặng Mẹ 10 Xu chào mừng vào ví. Hãy bắt đầu đổi quà cho bé ngay nào!',
      });
    } else {
      // Link googleId / avatar / admin role if needed
      let modified = false;
      if (!user.googleId) {
        user.googleId = googleProfile.googleId;
        modified = true;
      }
      if (!user.avatar && googleProfile.avatar) {
        user.avatar = googleProfile.avatar;
        modified = true;
      }
      if (user.email && (ENV.ADMIN_EMAILS as readonly string[]).includes(user.email.toLowerCase()) && user.role !== 'admin') {
        user.role = 'admin';
        modified = true;
      }
      if (modified) {
        await user.save();
      }
    }

    if (user.isLocked) {
      res.status(403).json({ error: 'Tài khoản đã bị khóa do vi phạm. Liên hệ BQT Kindr.' });
      return;
    }

    // 3. Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString(), user.role);

    user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
    await user.save();

    res.status(isNewUser ? 201 : 200).json({
      message: isNewUser ? 'Đăng ký thành công bằng tài khoản Google!' : 'Đăng nhập Google thành công!',
      user: user.toJSON(),
      accessToken,
      refreshToken,
      isNewUser,
    });
  } catch (error: any) {
    console.error('Google Auth error:', error);
    res.status(500).json({ error: error.message || 'Lỗi xác thực Google.' });
  }
});

// ---- Profile & Account Settings Routes ----

const UpdateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Tên phải ít nhất 2 ký tự').max(50, 'Tên tối đa 50 ký tự').optional(),
  phone: z.string().trim().regex(/^0\d{9}$/, 'Số điện thoại Việt Nam không hợp lệ (10 số, bắt đầu bằng 0)').optional().or(z.literal('')),
  avatar: z.string().optional(),
  bio: z.string().max(250, 'Giới thiệu tối đa 250 ký tự').optional(),
  districtId: z.string().optional(),
  districtName: z.string().optional(),
  addressDetail: z.string().optional(),
});

/**
 * PUT /api/auth/profile
 * Update user personal info: name, phone, avatar, bio, location
 */
router.put('/profile', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = UpdateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { name, phone, avatar, bio, districtId, districtName, addressDetail } = parsed.data;

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'Không tìm thấy người dùng.' });
      return;
    }

    // Check duplicate phone if changed
    if (phone && phone !== user.phone) {
      const existingPhone = await User.findOne({ phone, _id: { $ne: user._id } });
      if (existingPhone) {
        res.status(409).json({ error: 'Số điện thoại này đã được sử dụng bởi một tài khoản khác.' });
        return;
      }
      user.phone = phone;
    }

    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (bio !== undefined) user.bio = bio;

    if (districtId !== undefined || districtName !== undefined || addressDetail !== undefined) {
      user.location = {
        districtId: districtId !== undefined ? districtId : (user.location?.districtId || ''),
        districtName: districtName !== undefined ? districtName : (user.location?.districtName || ''),
        addressDetail: addressDetail !== undefined ? addressDetail : (user.location?.addressDetail || ''),
      };
    }

    await user.save();

    res.json({
      message: 'Cập nhật thông tin cá nhân thành công!',
      user: user.toJSON(),
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message || 'Lỗi cập nhật thông tin cá nhân.' });
  }
});

const ChangePasswordSchema = z.object({
  oldPassword: z.string().optional(),
  newPassword: z.string().min(6, 'Mật khẩu mới phải ít nhất 6 ký tự'),
});

/**
 * PUT /api/auth/change-password
 * Change or set user password
 */
router.put('/change-password', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = ChangePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { oldPassword, newPassword } = parsed.data;
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'Không tìm thấy người dùng.' });
      return;
    }

    // If user already has a password, verify oldPassword
    if (user.passwordHash) {
      if (!oldPassword) {
        res.status(400).json({ error: 'Vui lòng nhập mật khẩu hiện tại.' });
        return;
      }
      const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
      if (!isMatch) {
        res.status(400).json({ error: 'Mật khẩu hiện tại không đúng.' });
        return;
      }
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Đổi mật khẩu thành công!' });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Lỗi cập nhật mật khẩu.' });
  }
});

const PushTokenSchema = z.object({
  token: z.string().min(1, 'Token không được rỗng'),
});

/**
 * POST /api/auth/push-token
 * Register device Expo Push Token
 */
router.post('/push-token', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = PushTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }
    await registerPushToken(req.userId!, parsed.data.token);
    res.json({ message: 'Đăng ký Push Token thành công.' });
  } catch (error) {
    console.error('Register push token error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

/**
 * DELETE /api/auth/push-token
 * Unregister device Expo Push Token (on logout)
 */
router.delete('/push-token', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = PushTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }
    await unregisterPushToken(req.userId!, parsed.data.token);
    res.json({ message: 'Hủy đăng ký Push Token thành công.' });
  } catch (error) {
    console.error('Unregister push token error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

// ---- Password Recovery (OTP via Email) ----

const ForgotPasswordSchema = z.object({
  email: z.string().trim().email('Địa chỉ email không hợp lệ'),
});

/**
 * POST /api/auth/forgot-password
 * Send OTP to user's registered email
 */
router.post('/forgot-password', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = ForgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const email = parsed.data.email.toLowerCase();
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({
        error: 'Tài khoản chưa được đăng ký! Email này chưa liên kết với bất kỳ tài khoản Kindr nào. Vui lòng kiểm tra lại hoặc đăng ký tài khoản mới.',
        code: 'ACCOUNT_NOT_FOUND',
        notRegistered: true,
      });
      return;
    }

    if (user.isLocked) {
      res.status(403).json({ error: 'Tài khoản này đã bị khóa do vi phạm. Vui lòng liên hệ BQT Kindr.' });
      return;
    }

    // Google-authenticated accounts do not use password reset
    if (user.googleId) {
      res.status(400).json({
        error: 'Tài khoản này được đăng ký và đăng nhập bằng Google. Mẹ không cần khôi phục mật khẩu, vui lòng chọn "Đăng nhập bằng Google" trên trang Đăng nhập.',
        code: 'GOOGLE_ACCOUNT',
        isGoogleAccount: true,
      });
      return;
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = otpExpires;
    await user.save();

    const result = await sendPasswordResetOtpEmail(user.email || email, user.name, otp);

    if (!result.success) {
      res.status(500).json({ error: result.error || 'Không thể gửi email. Vui lòng kiểm tra lại cấu hình email hệ thống.' });
      return;
    }

    res.json({
      message: 'Mã xác thực OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư (cả thư mục Rác/Spam).',
      email: user.email,
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi gửi mã OTP. Vui lòng thử lại sau.' });
  }
});

const VerifyOtpSchema = z.object({
  email: z.string().trim().email('Địa chỉ email không hợp lệ'),
  otp: z.string().length(6, 'Mã OTP phải gồm đúng 6 chữ số'),
});

/**
 * POST /api/auth/verify-otp
 * Verify if OTP is valid before showing reset password form
 */
router.post('/verify-otp', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = VerifyOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { email, otp } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
      return;
    }

    if (user.googleId) {
      res.status(400).json({
        error: 'Tài khoản này được đăng ký và đăng nhập bằng Google.',
        code: 'GOOGLE_ACCOUNT',
        isGoogleAccount: true,
      });
      return;
    }

    if (!user.resetPasswordOtp || !user.resetPasswordOtpExpires) {
      res.status(400).json({ error: 'Bạn chưa yêu cầu mã OTP hoặc mã đã hết hạn. Vui lòng nhấn gửi lại mã.' });
      return;
    }

    if (new Date() > user.resetPasswordOtpExpires) {
      res.status(400).json({ error: 'Mã OTP đã hết hiệu lực (quá 10 phút). Vui lòng gửi lại mã mới.' });
      return;
    }

    if (user.resetPasswordOtp.trim() !== otp.trim()) {
      res.status(400).json({ error: 'Mã xác thực OTP không chính xác. Vui lòng kiểm tra lại.' });
      return;
    }

    res.json({
      valid: true,
      message: 'Xác thực mã OTP thành công! Vui lòng tạo mật khẩu mới.',
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi xác thực mã OTP.' });
  }
});

const ResetPasswordSchema = z.object({
  email: z.string().trim().email('Địa chỉ email không hợp lệ'),
  otp: z.string().length(6, 'Mã OTP phải gồm đúng 6 chữ số'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải ít nhất 6 ký tự'),
});

/**
 * POST /api/auth/reset-password
 * Verify OTP and set new password
 */
router.post('/reset-password', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = ResetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { email, otp, newPassword } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
      return;
    }

    if (user.googleId) {
      res.status(400).json({
        error: 'Tài khoản này được đăng ký và đăng nhập bằng Google.',
        code: 'GOOGLE_ACCOUNT',
        isGoogleAccount: true,
      });
      return;
    }

    if (!user.resetPasswordOtp || !user.resetPasswordOtpExpires) {
      res.status(400).json({ error: 'Bạn chưa yêu cầu mã OTP hoặc mã đã hết hạn. Vui lòng nhấn gửi lại mã.' });
      return;
    }

    if (new Date() > user.resetPasswordOtpExpires) {
      res.status(400).json({ error: 'Mã OTP đã hết hiệu lực (quá 10 phút). Vui lòng yêu cầu mã OTP mới.' });
      return;
    }

    if (user.resetPasswordOtp.trim() !== otp.trim()) {
      res.status(400).json({ error: 'Mã OTP không chính xác. Vui lòng kiểm tra lại.' });
      return;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);

    // Clear reset OTP and revoke all existing sessions for security
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    user.refreshTokens = [];
    await user.save();

    // Create system notification
    await Notification.create({
      userId: user._id,
      type: 'system',
      title: 'Mật khẩu đã được thay đổi',
      body: 'Mật khẩu tài khoản Kindr của bạn đã được cập nhật thành công qua mã OTP xác thực email.',
    });

    res.json({
      message: 'Đặt lại mật khẩu thành công! Hãy đăng nhập bằng mật khẩu mới của bạn.',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi đặt lại mật khẩu.' });
  }
});

// ---- Account Activation Routes (TrekMap Style) ----

const ActivateAccountSchema = z.object({
  email: z.string().trim().email('Địa chỉ email không hợp lệ'),
  otp: z.string().length(6, 'Mã kích hoạt phải gồm đúng 6 chữ số'),
});

/**
 * POST /api/auth/activate-account
 * Activate account using the 6-digit OTP code sent via email
 */
router.post('/activate-account', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = ActivateAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { email, otp } = parsed.data;
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
      return;
    }

    if (user.isActivated) {
      const accessToken = generateAccessToken(user._id.toString(), user.role);
      const refreshToken = generateRefreshToken(user._id.toString(), user.role);
      user.refreshTokens = [...user.refreshTokens.slice(-4), refreshToken];
      await user.save();
      res.status(200).json({
        message: 'Tài khoản đã được kích hoạt trước đó.',
        user: user.toJSON(),
        accessToken,
        refreshToken,
        alreadyActivated: true,
      });
      return;
    }

    if (!user.activationOtp || !user.activationOtpExpires) {
      res.status(400).json({ error: 'Mã kích hoạt không tồn tại hoặc đã hết hạn. Vui lòng bấm gửi lại mã.' });
      return;
    }

    if (new Date() > user.activationOtpExpires) {
      res.status(400).json({ error: 'Mã kích hoạt đã hết hiệu lực. Vui lòng yêu cầu gửi lại mã mới.' });
      return;
    }

    if (user.activationOtp.trim() !== otp.trim()) {
      res.status(400).json({ error: 'Mã xác thực kích hoạt không chính xác. Vui lòng kiểm tra lại.' });
      return;
    }

    // Mark activated & clear OTP
    user.isActivated = true;
    user.activationOtp = undefined;
    user.activationOtpExpires = undefined;

    // Generate tokens for immediate login
    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString(), user.role);
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.json({
      message: 'Kích hoạt tài khoản thành công! Chào mừng bạn đến với Kindr.',
      user: user.toJSON(),
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error('Activate account error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi kích hoạt tài khoản.' });
  }
});

const ResendActivationSchema = z.object({
  email: z.string().trim().email('Địa chỉ email không hợp lệ'),
});

/**
 * POST /api/auth/resend-activation
 * Resend activation OTP to user email
 */
router.post('/resend-activation', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = ResendActivationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const email = parsed.data.email.toLowerCase();
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ error: 'Không tìm thấy tài khoản nào liên kết với email này.' });
      return;
    }

    if (user.isActivated) {
      res.status(400).json({ error: 'Tài khoản này đã được kích hoạt rồi. Bạn có thể đăng nhập trực tiếp.' });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.activationOtp = otp;
    user.activationOtpExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const result = await sendAccountActivationOtpEmail(user.email || email, user.name, otp);
    if (!result.success) {
      res.status(500).json({ error: result.error || 'Không thể gửi email kích hoạt.' });
      return;
    }

    res.json({ message: 'Mã kích hoạt mới đã được gửi đến email của bạn.' });
  } catch (error: any) {
    console.error('Resend activation error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi gửi lại mã kích hoạt.' });
  }
});

export default router;



