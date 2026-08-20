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

    // 2. Check duplicate phone
    const existing = await User.findOne({ phone });
    if (existing) {
      res.status(409).json({ error: 'Số điện thoại này đã được đăng ký.' });
      return;
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Create user with 10 Xu welcome credit
    const user = await User.create({
      name,
      phone,
      email,
      passwordHash,
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
        reason: 'Chào mừng gia nhập cộng đồng Kindr! Tặng 10 Xu chào mừng 🎉',
        date: new Date(),
      }],
    });

    // 5. Create welcome notification
    await Notification.create({
      userId: user._id,
      type: 'welcome_credit',
      title: `Chào mừng ${name}! 🎈`,
      body: 'Kindr đã gửi tặng Mẹ 10 Xu chào mừng vào ví. Hãy bắt đầu đổi quà cho bé ngay nào!',
    });

    // 6. Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString(), user.role);

    // 7. Store refresh token
    user.refreshTokens.push(refreshToken);
    await user.save();

    // 8. Response
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

    // 1. Find user
    const user = await User.findOne({ phone });
    if (!user) {
      res.status(401).json({ error: 'Số điện thoại hoặc mật khẩu không đúng.' });
      return;
    }

    // 2. Check locked
    if (user.isLocked) {
      res.status(403).json({ error: 'Tài khoản đã bị khóa do vi phạm. Liên hệ BQT Kindr.' });
      return;
    }

    // 3. Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Số điện thoại hoặc mật khẩu không đúng.' });
      return;
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

export default router;
