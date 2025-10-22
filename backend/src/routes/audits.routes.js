const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const auditsController = require('../controllers/audits.controller');

router.use(authenticateToken);

router.get('/', auditsController.getAudits);

module.exports = router;