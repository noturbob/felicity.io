import { Request, Response, NextFunction } from 'express';

// The 'admin' middleware checks if the user attached to the request by the 'protect' middleware has the 'admin' role.
export const admin = (req: Request, res: Response, next: NextFunction) => {
  // FIX: Add a type guard ('role' in req.user) to safely check for the property's existence.
  // This confirms to TypeScript that we are handling the case where 'role' might be missing.
  if (req.user && 'role' in req.user && req.user.role === 'admin') {
    next(); // If the user is an admin, proceed to the controller.
  } else {
    // If not, send a 403 Forbidden error.
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

