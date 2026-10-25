import { AuthService } from '../modules/auth/authService.js';
import { AuthenticationError } from './errorHandler.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationError('Missing or malformed Authorization header.'));
  }

  const token = authHeader.substring(7).trim();
  try {
    const payload = AuthService.verifyAccessToken(token);
    req.user = {
      userId: payload.userId,
      email: payload.email,
      displayName: payload.displayName
    };
    next();
  } catch (err) {
    next(err);
  }
}
