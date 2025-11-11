const express = require('express');
const IssueService = require('../services/issueService');
const router = express.Router();

// Create issue
router.post('/', async (req, res) => {
  try {
    const issueData = req.body;
    
    if (!issueData.title || !issueData.description || !issueData.user_id) {
      return res.status(400).json({ error: 'Title, description, and user_id are required' });
    }

    const result = await IssueService.createIssue(issueData);
    
    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }

    res.status(201).json({ issue: result.issue });
  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get issues
router.get('/', async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.query;
    
    let location = null;
    if (latitude && longitude) {
      location = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      };
    }

    const result = await IssueService.getIssues(location, radius ? parseInt(radius) : 5000);
    
    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }

    res.json({ issues: result.issues });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upvote issue
router.post('/:issueId/upvote', async (req, res) => {
  try {
    const { issueId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const result = await IssueService.upvoteIssue(issueId, userId);
    
    if (result.error) {
      return res.status(400).json({ error: result.error.message || result.error });
    }

    res.json({ message: 'Issue upvoted successfully' });
  } catch (error) {
    console.error('Upvote error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update issue status
router.put('/:issueId/status', async (req, res) => {
  try {
    const { issueId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const result = await IssueService.updateIssueStatus(issueId, status);
    
    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }

    res.json({ issue: result.issue });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
