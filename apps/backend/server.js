import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import connectDB from './config/db.js';
import { connectRedis } from './config/redis.js';
import { initSocket } from './socket/index.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { subdomainProxy } from './middleware/subdomainProxy.js';
import User from './models/User.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import deploymentRoutes from './routes/deployments.js';
import aiRoutes from './routes/ai.js';
import monitoringRoutes from './routes/monitoring.js';
import client from 'prom-client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Security
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.FRONTEND_URL].filter(Boolean),
    },
  } : false,
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Logging
if (process.env.NODE_ENV === 'production') {
  const fs = await import('fs');
  const logDir = path.join(__dirname, '..', 'logs');
  await fs.mkdir(logDir, { recursive: true }).catch(() => {});
  const logStream = fs.createWriteStream(path.join(logDir, 'access.log'), { flags: 'a' });
  app.use(morgan('combined', { stream: logStream }));
} else {
  app.use(morgan('dev'));
}

app.use(subdomainProxy);
app.use(express.json({ limit: '10mb' }));
app.use(apiLimiter);
client.collectDefaultMetrics();

// Passport OAuth strategies
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ oauthId: profile.id, oauthProvider: 'google' });
    if (!user) {
      user = await User.create({
        name: profile.displayName, email: profile.emails[0].value,
        avatar: profile.photos[0]?.value, oauthProvider: 'google', oauthId: profile.id,
      });
    }
    done(null, user);
  } catch (err) { done(err, null); }
}));

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: '/api/auth/github/callback',
  scope: ['user:email'],
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ oauthId: profile.id, oauthProvider: 'github' });
    if (!user) {
      const email = profile.emails?.[0]?.value || `${profile.username}@github.com`;
      user = await User.create({
        name: profile.displayName || profile.username, email,
        avatar: profile.photos[0]?.value, oauthProvider: 'github', oauthId: profile.id,
        githubToken: accessToken,
      });
    } else if (accessToken) {
      user.githubToken = accessToken;
      await user.save();
    }
    done(null, user);
  } catch (err) { done(err, null); }
}));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/deployments', deploymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/monitoring', monitoringRoutes);

// Prometheus metrics
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io') || req.path === '/metrics') {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await connectRedis().catch(() => console.warn('Redis unavailable, continuing without cache'));
  initSocket(server);
  server.listen(PORT, () => {
    console.log(`DevOpsPilot AI backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
};

start();
