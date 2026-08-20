// server/src/app.ts
// ========================================
// Kindr Backend — Main Entry Point
// Express + Socket.IO + MongoDB
// ========================================
import http from 'http';
import { ENV } from './config/env';
import { connectDB } from './config/db';
import { setupSocketIO } from './socket';
import { initCronJobs } from './services/cronService';
import { createApp } from './createApp';

async function startServer() {
  // 1. Connect to MongoDB
  await connectDB();

  // 2. Start Background Cron Jobs
  initCronJobs();

  // 3. Create Express app
  const app = createApp();

  // 4. Create HTTP server + Socket.IO
  const httpServer = http.createServer(app);
  setupSocketIO(httpServer);

  // 5. Start listening
  httpServer.listen(ENV.PORT, () => {
    console.log(`\n🚀 Kindr Server running at http://localhost:${ENV.PORT}`);
    console.log(`📡 Socket.IO ready`);
    console.log(`🏥 Health: http://localhost:${ENV.PORT}/api/health`);
    console.log(`📦 Environment: ${ENV.NODE_ENV}\n`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
