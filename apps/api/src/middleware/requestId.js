import { v4 as uuidv4 } from 'uuid';

export function requestIdMiddleware(req, res, next) {
  const existingId = req.headers['x-request-id'];
  const requestId = typeof existingId === 'string' && existingId.trim() ? existingId.trim() : `req_${uuidv4().replace(/-/g, '')}`;
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}
