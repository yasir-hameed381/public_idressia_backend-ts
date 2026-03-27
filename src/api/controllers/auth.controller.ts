import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import * as authService from '../services/authService';
import { ErrorMessages } from '../Enums/errorMessages';

export const register = async (req: AuthRequest, res: Response) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({
      message: ErrorMessages.EMAIL_PASSWORD_NAME_REQUIRED,
    });
  }

  try {
    const response = await authService.register(email, password, name);
    return res.status(201).json(response);
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode || 500;
    return res.status(statusCode).json({
      message: (error as Error).message || ErrorMessages.REGISTRATION_ERROR,
    });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: ErrorMessages.EMAIL_PASSWORD_REQUIRED,
    });
  }

  try {
    const ipAddress = req.ip || (req.connection as { remoteAddress?: string })?.remoteAddress || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
    const response = await authService.login(email, password, ipAddress);
    return res.status(200).json(response);
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode || 500;

    if (statusCode === 429) {
      return res.status(429).json({
        success: false,
        message: (error as Error).message,
        seconds: (error as { seconds?: number }).seconds,
        minutes: (error as { minutes?: number }).minutes,
      });
    }

    return res.status(statusCode).json({
      success: false,
      message: (error as Error).message || ErrorMessages.LOGIN_ERROR,
    });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await authService.getUserWithPermissions(userId);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: (error as Error).message || 'Error fetching user data',
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { name, email, phone_number } = req.body as {
    name?: string;
    email?: string;
    phone_number?: string;
  };

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!name || !email) {
    return res.status(400).json({
      message: 'Name and email are required.',
    });
  }

  try {
    const user = await authService.updateProfile(userId, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone_number: phone_number?.trim() || null,
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user,
    });
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: (error as Error).message || 'Failed to update profile.',
    });
  }
};

export const updatePassword = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { current_password, password, password_confirmation } = req.body as {
    current_password?: string;
    password?: string;
    password_confirmation?: string;
  };

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!current_password || !password || !password_confirmation) {
    return res.status(400).json({
      message: 'Current password, new password and confirmation are required.',
    });
  }

  if (password.length < 8) {
    return res.status(422).json({
      message: 'New password must be at least 8 characters long.',
    });
  }

  if (password !== password_confirmation) {
    return res.status(422).json({
      message: 'Password confirmation does not match.',
    });
  }

  try {
    await authService.updatePassword(userId, { current_password, password });
    return res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: (error as Error).message || 'Failed to update password.',
    });
  }
};
