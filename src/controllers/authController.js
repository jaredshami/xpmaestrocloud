const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { ValidationError, AuthenticationError } = require('../utils/errors');

const prisma = new PrismaClient();

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    // Find admin user
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!passwordMatch) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({ token, user: { id: admin.id, email: admin.email } });
  } catch (error) {
    next(error);
  }
};

exports.register = async (req, res, next) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      throw new ValidationError('Email, password, and confirmation are required');
    }

    if (password !== confirmPassword) {
      throw new ValidationError('Passwords do not match');
    }

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      throw new ValidationError('Admin already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        email,
        passwordHash,
      },
    });

    res.status(201).json({ message: 'Admin created successfully', id: admin.id });
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};
