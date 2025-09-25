// import { Request, Response, NextFunction } from 'express';
// import jwt from 'jsonwebtoken';
// import { UserModel } from '../models/User';

// export interface AuthRequest extends Request {
//   user?: any;
// }

// export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
//   if (!token) {
//     return res.status(401).json({ error: 'Access token required' });
//   }
  
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
//     const user = await UserModel.findById(decoded.userId);
    
//     if (!user || !user.is_active) {
//       return res.status(401).json({ error: 'Invalid or inactive user' });
//     }
    
//     req.user = user;
//     next();
//   } catch (error) {
//     console.error('Token verification failed:', error);
//     return res.status(403).json({ error: 'Invalid token' });
//   }
// };

// export const requireRole = (roles: string[]) => {
//   return (req: AuthRequest, res: Response, next: NextFunction) => {
//     if (!req.user) {
//       return res.status(401).json({ error: 'Authentication required' });
//     }
    
//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({ error: 'Insufficient permissions' });
//     }
    
//     next();
//   };
// };

// export const requireAdmin = requireRole(['admin']);
// export const requireAffiliate = requireRole(['affiliate', 'admin']);
// export const requireCoordinator = requireRole(['coordinator', 'admin']);

// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { UserModel } from '../models/User';

export interface AuthRequest extends Request {
  user?: any;
}

/**
 * authenticateToken
 * - Accepts "Authorization: Bearer <token>" or just the token value.
 * - Returns 401 for missing token, 401 for invalid token (malformed), 401 for expired token.
 * - Returns 401 for non-existent or inactive users.
 * - Attaches the full user object to req.user on success.
 */
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rawAuth = (req.headers['authorization'] || req.headers['Authorization']) as string | undefined;
    if (!rawAuth) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Support either "Bearer <token>" or just "<token>"
    const parts = rawAuth.split(' ');
    const token = parts.length === 2 && parts[0].toLowerCase() === 'bearer' ? parts[1] : parts[0];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not set!');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret) as any;
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        return res.status(401).json({ error: 'Token expired' });
      }
      if (err instanceof JsonWebTokenError) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      // generic fallback
      console.warn('Token verification unexpected error:', err);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // decoded should contain userId (as you set in login). Validate it exists.
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    // Fetch user and check active status
    const user = await UserModel.findById(decoded.userId);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    // attach user to request
    req.user = user;
    next();
  } catch (error) {
    // Catch-all: ensure we don't leak internal stack traces to clients
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

/**
 * requireRole
 * - Keeps your existing role guard logic.
 */
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireAdmin = requireRole(['admin']);
export const requireAffiliate = requireRole(['affiliate', 'admin']);
export const requireCoordinator = requireRole(['coordinator', 'admin']);
