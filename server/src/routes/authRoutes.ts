import express from 'express';
import passport from 'passport';
import { registerUser, loginUser } from '../controllers/authControllers';
import jwt from 'jsonwebtoken';

const router = express.Router();

const CLIENT_HOME_PAGE_URL = "http://localhost:3000/home";

router.post('/register', registerUser);
router.post('/login', loginUser);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: '/login/failed', // A route you can handle on the client
  session: false // We are using JWT, not sessions
}), (req: any, res) => {
    // On success, generate JWT
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET!, {
        expiresIn: '30d',
    });
    // Redirect to client with token
    res.redirect(`${CLIENT_HOME_PAGE_URL}?token=${token}`);
});

export default router;
