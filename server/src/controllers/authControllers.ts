import { Request, Response } from 'express';
import User, { UserDocument } from '../models/User';
import jwt from 'jsonwebtoken';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: '30d',
  });
};

export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  
  try {
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide all required fields' 
      });
    }

    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists' 
      });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken((user._id as any).toString()),
      });
    } else {
      res.status(400).json({ 
        success: false,
        message: 'Invalid user data' 
      });
    }
  } catch (error: any) {
    console.error('❌ Register error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide email and password' 
      });
    }

    const user: UserDocument | null = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken((user._id as any).toString()),
      });
    } else {
      res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }
  } catch (error: any) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};