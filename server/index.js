import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const port = Number(process.env.PORT || 4000);

const parseAllowedOrigins = () => {
  const configured = String(process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const frontendUrl = String(process.env.FRONTEND_URL || '').trim();
  const defaults = ['http://localhost:5173'];

  if (frontendUrl) {
    defaults.push(frontendUrl);
  }

  return new Set([...defaults, ...configured]);
};

const allowedOrigins = parseAllowedOrigins();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin not allowed'));
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

// Dynamic imports after .env is loaded
const { default: ocrPrescriptionRoute } = await import('./routes/ocrPrescriptionRoute.js');
const { default: googleCalendarRoute } = await import('./routes/googleCalendarRoute.js');

app.use('/api', ocrPrescriptionRoute);
app.use('/api/google', googleCalendarRoute);

app.use((error, _req, res, _next) => {
  console.error('Unhandled server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(port, () => {
  console.log(`OCR API server running on http://localhost:${port}`);
});

server.on('error', (error) => {
  if (error?.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the existing process or set a different PORT.`);
    process.exit(1);
    return;
  }

  console.error('Failed to start API server:', error);
  process.exit(1);
});

const shutdown = (signal) => {
  console.log(`${signal} received, shutting down API server...`);
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
