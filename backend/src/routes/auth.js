const express = require('express');
const AuthService = require('../services/authService');
const router = express.Router();

// Sign up
router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await AuthService.createUser(email, password, fullName);
    
    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }

    res.status(201).json({ user: result.user });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sign in
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await AuthService.signInUser(email, password);
    
    if (result.error) {
      return res.status(401).json({ error: result.error.message });
    }

    res.json({ user: result.user });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const profile = await AuthService.getUserProfile(userId);
    
    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: profile });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
