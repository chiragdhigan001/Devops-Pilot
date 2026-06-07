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

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password });
    res.status(201).json(userResponse(user, generateTokens(user._id)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
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
  res.redirect(`${process.env.FRONTEND_URL}/oauth/callback?token=${tokens.token}&refreshToken=${tokens.refreshToken}`);
};
