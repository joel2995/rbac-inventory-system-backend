const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.use(protect);
router.get('/users', authorize('admin'), authController.getUsers);
router.delete('/users/:id', authorize('admin'), authController.deleteUser);

module.exports = router;