// api/waitlist/stats.js - Vercel Serverless Function
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://kindradmin:KindrPass2026@cluster0.vdazcdf.mongodb.net/kindr?retryWrites=true&w=majority&appName=Cluster0';

const WaitlistSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  orderNumber: { type: Number, required: true },
}, { timestamps: true });

let WaitlistModel;
try {
  WaitlistModel = mongoose.model('Waitlist');
} catch {
  WaitlistModel = mongoose.model('Waitlist', WaitlistSchema);
}

let isConnected = false;
async function connectDb() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGO_URI, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000,
  });
  isConnected = true;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDb();
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
      data: {
        total,
        target,
        remaining,
        percentage,
        realCount,
      }
    });
  } catch (error) {
    console.error('[VERCEL STATS API] Error:', error);
    return res.status(500).json({ error: error.message || 'Lỗi tải thống kê' });
  }
};
