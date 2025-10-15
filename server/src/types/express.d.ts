import { UserDocument } from '../models/User';

// This uses declaration merging to globally add the 'user' property 
// to the Express Request interface.
declare global {
  namespace Express {
    export interface Request {
      user?: UserDocument;
    }
  }
}