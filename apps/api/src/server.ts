// Fastify Server Entry Point
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load environment variables
// Priority: local .env > root .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localEnvPath = path.resolve(__dirname, '../.env');
const rootEnvPath = path.resolve(__dirname, '../../../.env.local');

if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
  console.log(`[env] Loading from ${localEnvPath}`);
} else {
  dotenv.config({ path: rootEnvPath });
  console.log(`[env] Loading from ${rootEnvPath}`);
}

import { buildApp } from './app.js';
import { prisma } from '@electrovault/database';
import { ensureBucketExists } from './lib/minio.js';

const PORT = parseInt(process.env.API_PORT || '3001', 10);
const HOST = process.env.API_HOST || '0.0.0.0';

async function start() {
  const app = await buildApp();

  try {
    // Initialize MinIO Bucket (non-blocking - file uploads will fail if MinIO is not available)
    try {
      await ensureBucketExists();
      app.log.info('✅ MinIO bucket initialized');
    } catch (minioError) {
      app.log.warn('⚠️ MinIO not available - file uploads will be disabled');
      app.log.warn(`   Error: ${(minioError as Error).message}`);
    }

    // Start server
    await app.listen({ port: PORT, host: HOST });

    app.log.info(`🚀 Server listening on http://${HOST}:${PORT}`);
    app.log.info(`📊 Health check: http://${HOST}:${PORT}/health`);
    app.log.info(`🔐 Auth endpoint: http://${HOST}:${PORT}/api/v1/me`);
    app.log.info(`📁 File upload: http://${HOST}:${PORT}/api/v1/files`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

start();
