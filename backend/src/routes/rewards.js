const express = require('express');
const RewardService = require('../services/rewardService');
const router = express.Router();

// Get user rewards
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await RewardService.getUserRewards(userId);
    
    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }

    res.json({ rewards: result.rewards });
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user stats and rewards
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await RewardService.getUserStats(userId);
    
    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }

    res.json({
      user: result.user,
      stats: result.stats,
      rewards: result.rewards
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
