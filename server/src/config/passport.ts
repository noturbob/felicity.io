import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

export const configurePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: '/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            return done(null, user);
          } else {
            user = await User.findOne({ email: profile.emails?.[0].value });

            if (user) {
              // User exists with email, link Google ID
              user.googleId = profile.id;
              await user.save();
              return done(null, user);
            }

            // Create new user
            const newUser = new User({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails?.[0].value,
              avatar: profile.photos?.[0].value,
            });

            await newUser.save();
            return done(null, newUser);
          }
        } catch (error: any) {
          return done(error, false);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
  });
};
