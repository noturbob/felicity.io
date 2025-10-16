import { Request, Response } from 'express';
import User, { UserDocument } from '../models/User';

// Get user profile
export const getUserProfile = async (req: Request, res: Response) => {
  // The 'user' property is attached by the 'protect' middleware.
  if (req.user) {
    // FIX: Cast req.user to UserDocument to ensure TypeScript knows its shape.
    const user = req.user as UserDocument;
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// Update user profile (name, email, password)
export const updateUserProfile = async (req: Request, res: Response) => {
    // FIX: Cast req.user at the start and get the ID.
    const userFromRequest = req.user as UserDocument;
    if (!userFromRequest?._id) {
        return res.status(401).json({ message: 'Not authorized' });
    }
    
    const user = await User.findById(userFromRequest._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        if (req.body.password) {
            user.password = req.body.password;
        }
        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            avatar: updatedUser.avatar, // Also return avatar on update
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// Update user avatar
export const updateUserAvatar = async (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file was uploaded.' });
    }

    // FIX: Cast req.user at the start and get the ID.
    const userFromRequest = req.user as UserDocument;
    if (!userFromRequest?._id) {
        return res.status(401).json({ message: 'Not authorized' });
    }

    try {
        const user = await User.findById(userFromRequest._id);
        if (user) {
            user.avatar = req.file.path;
            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                avatar: updatedUser.avatar,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error("Avatar upload error:", error);
        res.status(500).json({ message: 'Server error during avatar upload.' });
    }
};

// Delete user account
export const deleteUser = async (req: Request, res: Response) => {
    // FIX: Cast req.user at the start and get the ID.
    const userFromRequest = req.user as UserDocument;
    if (!userFromRequest?._id) {
        return res.status(401).json({ message: 'Not authorized' });
    }
    
    const user = await User.findById(userFromRequest._id);
    
    if(user){
        await user.deleteOne();
        res.json({ message: 'User account deleted successfully.' });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

