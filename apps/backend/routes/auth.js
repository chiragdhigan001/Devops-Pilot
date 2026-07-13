import { Router } from 'express';
import passport from 'passport';
import {
  register,
  login,
  refresh,
  getMe,
  oauthCallback,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

console.log('✅ auth.js loaded');

// Test route
router.get('/check', (req, res) => {
  res.send('Auth routes working');
});

// Normal auth
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.get('/me', protect, getMe);

// ---------------- GOOGLE ----------------

// Start Google OAuth
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

// Google callback
router.get('/google/callback', (req, res, next) => {
  passport.authenticate(
    'google',
    { session: false },
    (err, user, info) => {
      console.log('==============================');
      console.log('Google OAuth Debug');
      console.log('Error:', err);
      console.log('Info:', info);
      console.log('User:', user);
      console.log('Query:', req.query);
      console.log('==============================');

      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(401).json({
          message: 'Google authentication failed',
          error: info,
        });
      }

      req.user = user;
      return oauthCallback(req, res);
    }
  )(req, res, next);
});

// ---------------- GITHUB ----------------

router.get(
  '/github',
  passport.authenticate('github', {
    scope: ['user:email'],
    session: false,
  })
);

router.get(
  '/github/callback',
  passport.authenticate('github', { session: false }),
  oauthCallback
);

export default router;
