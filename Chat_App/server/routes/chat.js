const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');

router.get('/messages', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'This is a protected message route',
    user: req.user, // decoded from token
  });
});

module.exports = router;
