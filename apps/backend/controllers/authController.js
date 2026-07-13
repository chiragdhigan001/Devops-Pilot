import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
};

const generateTokens = (id) => ({
  token: generateAccessToken(id),
  refreshToken: generateRefreshToken(id),
});

const userResponse = (user, tokens) => ({
  _id: user._id, name: user.name, email: user.email, role: user.role,
  ...tokens,
});

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters' });
    }
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ message: 'Valid email is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ name: name.trim(), email: email.toLowerCase(), password });
    res.status(201).json(userResponse(user, generateTokens(user._id)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json(userResponse(user, generateTokens(user._id)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });
    res.json({ token: generateAccessToken(user._id) });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

export const getMe = async (req, res) => {
  res.json(req.user);
};

export const oauthCallback = async (req, res) => {
  const tokens = generateTokens(req.user._id);

  const redirectUrl =
    `${process.env.FRONTEND_URL}/oauth/callback?token=${tokens.token}&refreshToken=${tokens.refreshToken}`;

  console.log("OAuth redirect:", redirectUrl);

  res.redirect(redirectUrl);
};
