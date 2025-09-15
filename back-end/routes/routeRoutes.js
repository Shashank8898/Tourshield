const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    analyzeRoute,
    saveRoute,
    getUserRoutes
} = require('../controllers/routeController');

router.post('/analyze', authenticateToken, analyzeRoute);
router.post('/save', authenticateToken, saveRoute);
router.get('/user/:userId', authenticateToken, getUserRoutes);

module.exports = router;
