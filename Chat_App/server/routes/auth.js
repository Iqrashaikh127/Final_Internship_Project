const express = require('express');
const router = express.Router();
const { register, login, getAllUsers } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/users', authMiddleware, getAllUsers);

module.exports = router;
