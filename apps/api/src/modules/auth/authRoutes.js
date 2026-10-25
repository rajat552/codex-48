import express from 'express';
import { AuthController } from './authController.js';
import { authLimiter } from '../../middleware/rateLimit.js';
import { authenticate } from '../../middleware/authenticate.js';

export const authRouter = express.Router();

authRouter.post('/register', authLimiter, AuthController.register);
authRouter.post('/login', authLimiter, AuthController.login);
authRouter.post('/refresh', authLimiter, AuthController.refresh);
authRouter.post('/logout', authenticate, AuthController.logout);
authRouter.get('/me', authenticate, AuthController.me);
