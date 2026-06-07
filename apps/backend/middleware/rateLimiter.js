import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many auth attempts, please try again later' },
});

export const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: { message: 'AI rate limit exceeded, please try again later' },
});
