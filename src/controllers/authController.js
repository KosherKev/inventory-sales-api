const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const LocationUser = require('../models/LocationUser');
const RefreshToken = require('../models/RefreshToken');

// Access token helpers
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m'
  });
};

// Refresh token helpers
const REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const generateRefreshTokenValue = () => crypto.randomBytes(48).toString('hex');

const createRefreshToken = async (userId, replacingTokenValue = null) => {
  const tokenValue = generateRefreshTokenValue();
  // Compute expiry date from REFRESH_EXPIRE (supports "Nd" days or default 7d)
  const now = new Date();
  let expiresAt = new Date(now);
  // Parse patterns like '7d' or seconds '3600s'
  if (String(REFRESH_EXPIRE).endsWith('d')) {
    const days = parseInt(String(REFRESH_EXPIRE).slice(0, -1));
    expiresAt.setDate(expiresAt.getDate() + (isNaN(days) ? 7 : days));
  } else if (String(REFRESH_EXPIRE).endsWith('h')) {
    const hours = parseInt(String(REFRESH_EXPIRE).slice(0, -1));
    expiresAt.setHours(expiresAt.getHours() + (isNaN(hours) ? 24 * 7 : hours));
  } else {
    // Fallback 7 days
    expiresAt.setDate(expiresAt.getDate() + 7);
  }

  const doc = await RefreshToken.create({
    userId,
    token: tokenValue,
    expiresAt,
    revoked: false,
    replacedByToken: replacingTokenValue || undefined
  });

  return doc.token;
};

// Validate and rotate refresh token
const rotateRefreshToken = async (oldTokenValue) => {
  if (!oldTokenValue) return null;
  const record = await RefreshToken.findOne({ token: oldTokenValue });
  if (!record || record.revoked) return null;
  if (record.expiresAt < new Date()) return null;
  // revoke and replace
  const newTokenValue = generateRefreshTokenValue();
  record.revoked = true;
  record.replacedByToken = newTokenValue;
  await record.save();
  const now = new Date();
  let expiresAt = new Date(now);
  if (String(REFRESH_EXPIRE).endsWith('d')) {
    const days = parseInt(String(REFRESH_EXPIRE).slice(0, -1));
    expiresAt.setDate(expiresAt.getDate() + (isNaN(days) ? 7 : days));
  } else if (String(REFRESH_EXPIRE).endsWith('h')) {
    const hours = parseInt(String(REFRESH_EXPIRE).slice(0, -1));
    expiresAt.setHours(expiresAt.getHours() + (isNaN(hours) ? 24 * 7 : hours));
  } else {
    expiresAt.setDate(expiresAt.getDate() + 7);
  }
  await RefreshToken.create({ userId: record.userId, token: newTokenValue, expiresAt });
  return newTokenValue;
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: role || 'staff'
    });

    // Generate tokens
    const token = generateAccessToken(user._id);
    const refreshToken = await createRefreshToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user (include password for comparison)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account is inactive. Please contact administrator.'
      });
    }

    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate tokens
    const token = generateAccessToken(user._id);
    const refreshToken = await createRefreshToken(user._id);

    // Get user's locations
    const userLocations = await LocationUser.find({ userId: user._id })
      .populate('locationId', 'name address description');

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          role: user.role
        },
        token,
        refreshToken,
        locations: userLocations
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Get user's locations (normalized structure)
    const locationUsers = await LocationUser.find({ userId: user._id })
      .populate('locationId', 'name address description isActive');

    const locations = locationUsers
      .filter(lu => lu.locationId && lu.locationId.isActive)
      .map(lu => ({
        id: lu.locationId._id,
        name: lu.locationId.name,
        address: lu.locationId.address,
        description: lu.locationId.description,
        userRole: lu.role,
        permissions: lu.permissions
      }));

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          role: user.role,
          isActive: user.isActive
        },
        locations
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

// @desc    Refresh access token (rotate refresh token)
// @route   POST /api/auth/refresh
// @access  Public
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    const record = await RefreshToken.findOne({ token: refreshToken });
    if (!record || record.revoked) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
    if (record.expiresAt < new Date()) {
      return res.status(401).json({ success: false, message: 'Refresh token expired' });
    }

    const user = await User.findById(record.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not authorized' });
    }

    const token = generateAccessToken(user._id);
    const newRefreshToken = await rotateRefreshToken(refreshToken);
    if (!newRefreshToken) {
      return res.status(401).json({ success: false, message: 'Could not rotate refresh token' });
    }

    res.status(200).json({
      success: true,
      data: {
        token,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error refreshing token', error: error.message });
  }
};

// @desc    Logout (revoke refresh token)
// @route   POST /api/auth/logout
// @access  Public
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }
    const record = await RefreshToken.findOne({ token: refreshToken });
    if (record) {
      record.revoked = true;
      await record.save();
    }
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error logging out', error: error.message });
  }
};
