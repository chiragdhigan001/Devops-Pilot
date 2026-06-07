import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
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
import User from './models/User.js';

import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import deploymentRoutes from './routes/deployments.js';
import aiRoutes from './routes/ai.js';
import monitoringRoutes from './routes/monitoring.js';

const app = express();
const server = createServer(app);

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(apiLimiter);

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

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/deployments', deploymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/monitoring', monitoringRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await connectRedis();
  initSocket(server);
  server.listen(PORT, () => {
    console.log(`DevOpsPilot AI backend running on port ${PORT}`);
  });
};

start();
