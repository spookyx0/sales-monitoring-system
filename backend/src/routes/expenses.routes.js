const express = require('express');
const expensesController = require('../controllers/expenses.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticateToken);

router.post('/', expensesController.createExpense);
router.get('/', expensesController.getExpenses);
router.put('/:id', expensesController.updateExpense);
router.delete('/:id', expensesController.deleteExpense);

module.exports = router;