const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const analyticsController = require('../controllers/analytics.controller');

router.use(authenticateToken);

router.get('/overview', analyticsController.getOverview);
router.get('/monthly', analyticsController.getMonthly);

module.exports = router;