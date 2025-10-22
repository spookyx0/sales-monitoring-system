const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const expensesController = require('../controllers/expenses.controller');

router.use(authenticateToken);

router.post('/', expensesController.createExpense);
router.get('/', expensesController.getExpenses);

module.exports = router;