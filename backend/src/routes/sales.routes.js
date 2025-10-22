const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const salesController = require('../controllers/sales.controller');

router.use(authenticateToken);

router.post('/', salesController.createSale);
router.get('/', salesController.getSales);
router.get('/:id', salesController.getSale);

module.exports = router;