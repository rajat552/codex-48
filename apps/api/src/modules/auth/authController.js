import { AuthService } from './authService.js';

export class AuthController {
  static async register(req, res, next) {
    try {
      const { displayName, email, password, workspaceName } = req.body;
      const result = await AuthService.register({ displayName, email, password, workspaceName });
      return res.status(201).json({
        data: result,
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login({ email, password });
      return res.status(200).json({
        data: result,
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }

  static async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refresh({ refreshToken });
      return res.status(200).json({
        data: result,
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }

  static async logout(req, res, next) {
    try {
      // In JWT stateless architecture, client clears token; server responds 204
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  static async me(req, res, next) {
    try {
      const result = await AuthService.getMe(req.user.userId);
      return res.status(200).json({
        data: result,
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }
}
