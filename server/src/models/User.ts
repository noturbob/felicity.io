import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interface for the user properties
interface IUser {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  avatar?: string;
}

// Interface for the user document (includes Mongoose properties and our custom methods)
export interface UserDocument extends IUser, Document {
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<UserDocument>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
  },
  googleId: {
    type: String,
  },
  avatar: {
    type: String,
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function(enteredPassword: string): Promise<boolean> {
  // FIX: Added type to enteredPassword (already done, but confirmed here)
  return await bcrypt.compare(enteredPassword, this.password);
};

// FIX: Define the model with the UserDocument type
const User: Model<UserDocument> = mongoose.model<UserDocument>('User', userSchema);
export default User;

