import { Request, Response } from 'express';
import User, { UserDocument } from '../models/User'; // Import the UserDocument type

// Get user profile
export const getUserProfile = async (req: Request, res: Response) => {
  // The 'user' property comes from the 'protect' middleware
  if (req.user) {
    // Cast req.user to UserDocument to access its properties safely
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

// Update user profile
export const updateUserProfile = async (req: Request, res: Response) => {
    // FIX: Explicitly cast req.user to UserDocument before accessing its _id property.
    const userId = (req.user as UserDocument)?._id;

    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    const user = await User.findById(userId);

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
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// Delete user account
export const deleteUser = async (req: Request, res: Response) => {
    // FIX: Explicitly cast req.user to UserDocument here as well.
    const userId = (req.user as UserDocument)?._id;

    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    const user = await User.findById(userId);
    
    if(user){
        await user.deleteOne();
        res.json({ message: 'User account deleted successfully.' });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

