import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function signToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      roleLabel: user.role_label || user.roleLabel,
      centerId: user.center_id || user.centerId || null,
    },
    config.jwtSecret,
    { expiresIn: '12h' }
  );
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission for this action.' });
    }
    next();
  };
}

export function isLDRRMO(user) {
  return user?.role === 'ldrrmo';
}

export function canAccessCenter(user, centerId) {
  if (isLDRRMO(user)) return true;
  return user?.centerId === centerId;
}
