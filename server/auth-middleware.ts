import { Request, Response, NextFunction } from 'express';

// Extended Request interface with user information
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    roles?: string[];
  };
}

// Simple authentication middleware - in a real app, this would verify tokens
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // For development purposes, we'll assign a mock user
  // In production, this would validate tokens and extract user info
  req.user = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    roles: ['admin']
  };
  
  next();
}

// Role-based authorization middleware
export function requireRole(role: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized - Not authenticated' });
    }
    
    if (!req.user.roles || !req.user.roles.includes(role)) {
      return res.status(403).json({ message: 'Forbidden - Insufficient permissions' });
    }
    
    next();
  };
}