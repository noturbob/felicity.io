import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express'; // Use standard Express types
import User from '../models/User';

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

      // Find user and attach to the globally extended 'req.user'
      // FIX: The '|| undefined' converts a null result from the DB into undefined, satisfying TypeScript.
      req.user = await User.findById(decoded.id).select('-password') || undefined;

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next(); // Proceed to controller
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

