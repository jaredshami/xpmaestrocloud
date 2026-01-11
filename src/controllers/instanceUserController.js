const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ValidationError, NotFoundError, AuthenticationError } = require('../utils/errors');

const prisma = new PrismaClient();

// Instance user login
exports.loginInstanceUser = async (req, res, next) => {
  try {
    const { instanceId, email, password } = req.body;

    if (!instanceId || !email) {
      throw new ValidationError('instanceId and email are required');
    }

    const user = await prisma.instanceUser.findUnique({
      where: {
        instanceId_email: {
          instanceId: parseInt(instanceId),
          email,
        },
      },
    });

    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Check if this is first login with temp password - force password reset
    if (user.status === 'pending') {
      return res.status(200).json({
        requiresPasswordSetup: true,
        userId: user.id,
        instanceId: user.instanceId,
        email: user.email,
        message: 'Please set your password to continue',
      });
    }

    // Check if user needs to set password (passwordHash is null)
    if (!user.passwordHash) {
      return res.status(200).json({
        requiresPasswordSetup: true,
        userId: user.id,
        instanceId: user.instanceId,
        email: user.email,
        message: 'Please set your password to continue',
      });
    }

    if (!password) {
      throw new ValidationError('Password is required');
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw new AuthenticationError('Invalid credentials');
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        instanceId: user.instanceId, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        instanceId: user.instanceId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all users in an instance
exports.getInstanceUsers = async (req, res, next) => {
  try {
    const { instanceId } = req.params;

    const users = await prisma.instanceUser.findMany({
      where: { instanceId: parseInt(instanceId) },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
};

// Add user to instance
exports.addInstanceUser = async (req, res, next) => {
  try {
    const { instanceId } = req.params;
    const { email, name, role = 'editor' } = req.body;

    if (!email || !role) {
      throw new ValidationError('email and role are required');
    }

    // Check if user already exists
    const existingUser = await prisma.instanceUser.findUnique({
      where: {
        instanceId_email: {
          instanceId: parseInt(instanceId),
          email,
        },
      },
    });

    if (existingUser) {
      throw new ValidationError('User already exists in this instance');
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12);

    const user = await prisma.instanceUser.create({
      data: {
        instanceId: parseInt(instanceId),
        email,
        name,
        role,
        passwordHash: await bcrypt.hash(tempPassword, 10),
        status: 'pending',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    res.status(201).json({
      ...user,
      tempPassword, // Return temp password for sending to user
      message: 'User added successfully. Send temp password to user.',
    });
  } catch (error) {
    next(error);
  }
};

// Update user role
exports.updateInstanceUser = async (req, res, next) => {
  try {
    const { instanceId, userId } = req.params;
    const { role, status } = req.body;

    if (!role && !status) {
      throw new ValidationError('At least one of role or status must be provided');
    }

    const user = await prisma.instanceUser.update({
      where: { id: parseInt(userId) },
      data: {
        ...(role && { role }),
        ...(status && { status }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
};

// Remove user from instance
exports.removeInstanceUser = async (req, res, next) => {
  try {
    const { instanceId, userId } = req.params;

    // Check if user is the last admin
    const adminCount = await prisma.instanceUser.count({
      where: {
        instanceId: parseInt(instanceId),
        role: 'admin',
      },
    });

    if (adminCount === 1) {
      const user = await prisma.instanceUser.findUnique({
        where: { id: parseInt(userId) },
      });

      if (user.role === 'admin') {
        throw new ValidationError('Cannot remove the last admin from instance');
      }
    }

    await prisma.instanceUser.delete({
      where: { id: parseInt(userId) },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Set/reset password for instance user
exports.setInstanceUserPassword = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    const user = await prisma.instanceUser.update({
      where: { id: parseInt(userId) },
      data: {
        passwordHash: await bcrypt.hash(password, 10),
        status: 'active',
      },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });

    res.json({
      ...user,
      message: 'Password set successfully',
    });
  } catch (error) {
    next(error);
  }
};
